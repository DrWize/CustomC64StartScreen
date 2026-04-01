// C64 Boot Screen Editor - KERNAL ROM Patcher
// Handles: reading ROMs, simple text/color patching, extended PETSCII screen injection

class RomPatcher {
    constructor() {
        this.romData = null;      // Uint8Array of KERNAL ROM
        this.romFileName = '';
        this.chargenData = null;  // Uint8Array of chargen ROM
        this.chargenFileName = '';
    }

    // ── ROM Loading ─────────────────────────────────────────────────────

    loadKernalROM(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                if (data.length !== C64.ROM.SIZE) {
                    reject(new Error(`Invalid KERNAL ROM size: ${data.length} bytes (expected ${C64.ROM.SIZE})`));
                    return;
                }
                this.romData = data;
                this.romFileName = file.name;
                resolve(this._readRomInfo());
            };
            reader.onerror = () => reject(new Error('Failed to read ROM file'));
            reader.readAsArrayBuffer(file);
        });
    }

    loadChargenROM(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                if (data.length !== 4096) {
                    reject(new Error(`Invalid chargen ROM size: ${data.length} bytes (expected 4096)`));
                    return;
                }
                this.chargenData = new Uint8Array(data);
                this.chargenFileName = file.name;
                resolve(data);
            };
            reader.onerror = () => reject(new Error('Failed to read chargen ROM file'));
            reader.readAsArrayBuffer(file);
        });
    }

    // Read current settings from loaded ROM
    _readRomInfo() {
        if (!this.romData) return null;
        const rom = this.romData;

        // Read startup text
        const line1Bytes = rom.slice(C64.ROM.LINE1_OFFSET, C64.ROM.LINE1_OFFSET + C64.ROM.LINE1_LENGTH);
        const line2Bytes = rom.slice(C64.ROM.LINE2_OFFSET, C64.ROM.LINE2_OFFSET + C64.ROM.LINE2_LENGTH);

        let line1 = '';
        let line2 = '';
        for (let i = 0; i < line1Bytes.length; i++) {
            const b = line1Bytes[i];
            if (b === 0x0D) line1 += '\n';
            else if (b >= 0x20 && b <= 0x7E) line1 += String.fromCharCode(b);
            else line1 += ' ';
        }
        for (let i = 0; i < line2Bytes.length; i++) {
            const b = line2Bytes[i];
            if (b === 0x0D) line2 += '\n';
            else if (b >= 0x20 && b <= 0x7E) line2 += String.fromCharCode(b);
            else line2 += ' ';
        }

        return {
            line1: line1.trim(),
            line2: line2.trim(),
            borderColor: rom[C64.ROM.BORDER_COLOR_OFFSET],
            bgColor: rom[C64.ROM.BG_COLOR_OFFSET],
            textColor: rom[C64.ROM.TEXT_COLOR_OFFSET],
            fileName: this.romFileName,
            size: rom.length,
        };
    }

    // ── Simple Mode: Text & Color Patching ──────────────────────────────

    patchSimple(line1, line2, borderColor, bgColor, textColor) {
        if (!this.romData) throw new Error('No KERNAL ROM loaded');

        const rom = new Uint8Array(this.romData); // work on copy

        // Patch Line 1 (37 bytes at offset 1141)
        if (line1 !== undefined) {
            const padded = this._padLine1(line1);
            for (let i = 0; i < C64.ROM.LINE1_LENGTH; i++) {
                rom[C64.ROM.LINE1_OFFSET + i] = padded[i];
            }
        }

        // Patch Line 2 (17 bytes at offset 1178)
        if (line2 !== undefined) {
            const padded = this._padLine2(line2);
            for (let i = 0; i < C64.ROM.LINE2_LENGTH; i++) {
                rom[C64.ROM.LINE2_OFFSET + i] = padded[i];
            }
        }

        // Patch colors
        if (borderColor !== undefined) rom[C64.ROM.BORDER_COLOR_OFFSET] = borderColor & 0x0F;
        if (bgColor !== undefined) rom[C64.ROM.BG_COLOR_OFFSET] = bgColor & 0x0F;
        if (textColor !== undefined) rom[C64.ROM.TEXT_COLOR_OFFSET] = textColor & 0x0F;

        return rom;
    }

    _padLine1(text) {
        // Line 1 format: "    **** COMMODORE 64 BASIC V2 ****\r\r"
        // 37 bytes: 4 spaces + 4 stars + space + text + space + 4 stars + CR + CR
        // We'll just let user fill 37 bytes with their text, padded with spaces, ending with CR CR
        const maxLen = 35; // leave room for 2 x CR at end
        let clean = text.substring(0, maxLen).toUpperCase();
        // Center the text in 35 chars
        const padding = Math.max(0, Math.floor((35 - clean.length) / 2));
        clean = ' '.repeat(padding) + clean;
        clean = clean.padEnd(35, ' ');

        const bytes = new Uint8Array(C64.ROM.LINE1_LENGTH);
        for (let i = 0; i < 35 && i < clean.length; i++) {
            bytes[i] = clean.charCodeAt(i);
        }
        bytes[35] = 0x0D; // CR
        bytes[36] = 0x0D; // CR
        return bytes;
    }

    _padLine2(text) {
        // Line 2: " 64K RAM SYSTEM  " - 17 bytes, space-padded
        const maxLen = 17;
        let clean = text.substring(0, maxLen).toUpperCase();
        // Left-pad with one space
        clean = ' ' + clean;
        clean = clean.padEnd(17, ' ');

        const bytes = new Uint8Array(C64.ROM.LINE2_LENGTH);
        for (let i = 0; i < 17 && i < clean.length; i++) {
            bytes[i] = clean.charCodeAt(i);
        }
        return bytes;
    }

    // ── Extended Mode: Full PETSCII Screen Injection ────────────────────
    //
    // KERNAL startup flow (from ROM analysis):
    //   $E394: JSR $E453  (init BASIC vectors)
    //   $E397: JSR $E3BF  (init BASIC pointers)
    //   $E39A: JSR $E422  (print banner + bytes free, then JMP $A644)
    //
    // $E422 routine:
    //   Prints CLR screen + banner text via JSR $AB1E
    //   Calculates + prints free bytes
    //   Prints " BASIC BYTES FREE"
    //   JMP $A644 (BASIC warm start: prints "READY." + enters input loop)
    //
    // Our patch: Replace JSR $E422 at offset $039A with JSR $OurCode
    // Our code fills screen+color RAM, sets colors, positions cursor,
    // then JMP $A644 to let BASIC print READY. at our chosen position.

    patchExtended(screenState) {
        if (!this.romData) throw new Error('No KERNAL ROM loaded');

        const rom = new Uint8Array(this.romData); // work on copy
        const { screen, color, borderColor, bgColor } = screenState;

        // Find where READY. should go - scan for last non-space row
        let cursorRow = 0;
        for (let row = 24; row >= 0; row--) {
            let hasContent = false;
            for (let col = 0; col < 40; col++) {
                if (screen[row * 40 + col] !== 32) { hasContent = true; break; }
            }
            if (hasContent) {
                cursorRow = Math.min(row + 2, 24);
                break;
            }
        }

        // Text color for READY. - use the most common color in the design
        const colorCounts = new Array(16).fill(0);
        for (let i = 0; i < 1000; i++) {
            if (screen[i] !== 32) colorCounts[color[i]]++;
        }
        let readyColor = 1; // default white
        let maxCount = 0;
        for (let i = 0; i < 16; i++) {
            if (colorCounts[i] > maxCount) { maxCount = colorCounts[i]; readyColor = i; }
        }

        // RLE compress screen and color data
        const compScreen = this._rleCompress(screen);
        const compColor = this._rleCompress(color);

        // Build 6502 init code
        const initCode = this._buildInitCode(compScreen, compColor, borderColor, bgColor, cursorRow, readyColor);

        // Inject into safe area: offset $0500 (address $E500)
        const injectOffset = 0x0500;
        const injectAddr = 0xE500;
        const availableSpace = 0x0D00 - 0x0500; // ~2048 bytes
        if (initCode.length > availableSpace) {
            throw new Error(`Screen data too large: ${initCode.length} bytes (max ${availableSpace}). Try simplifying your design.`);
        }

        for (let i = 0; i < initCode.length; i++) {
            rom[injectOffset + i] = initCode[i];
        }

        // Hook: Replace JSR $E422 at offset $039A with JSR $E500
        rom[0x039A] = 0x20;                        // JSR
        rom[0x039B] = injectAddr & 0xFF;            // low byte
        rom[0x039C] = (injectAddr >> 8) & 0xFF;     // high byte

        return rom;
    }

    _buildInitCode(compScreen, compColor, borderColor, bgColor, cursorRow, readyColor) {
        // 6502 machine code that:
        // 1. Sets border/background colors
        // 2. Clears screen
        // 3. RLE decompresses screen data to $0400
        // 4. RLE decompresses color data to $D800
        // 5. Sets cursor position so BASIC's "READY." lands correctly
        // 6. Sets text color for READY.
        // 7. JMP $A644 (BASIC warm start — prints READY. + enters input loop)

        const BASE = 0xE500;
        const code = [];

        // Helper: emit an RLE decompressor block targeting destHigh page
        // Uses $FB/$FC = dest ptr, $FD/$FE = src ptr (set before calling)
        // RLE format: [count][byte] pairs, count=0 terminates
        function emitDecomp(destHigh) {
            // Setup dest pointer
            code.push(0xA9, 0x00);     // LDA #$00
            code.push(0x85, 0xFB);     // STA $FB
            code.push(0xA9, destHigh); // LDA #destHigh
            code.push(0x85, 0xFC);     // STA $FC

            // Source pointer — placeholder, patched later
            const srcLoPatch = code.length + 1;
            code.push(0xA9, 0x00);     // LDA #<src (PATCH)
            code.push(0x85, 0xFD);     // STA $FD
            const srcHiPatch = code.length + 1;
            code.push(0xA9, 0x00);     // LDA #>src (PATCH)
            code.push(0x85, 0xFE);     // STA $FE

            // RLE loop
            const loopTop = code.length;
            code.push(0xA0, 0x00);     // LDY #0
            code.push(0xB1, 0xFD);     // LDA ($FD),Y  — count
            const beqPatch = code.length;
            code.push(0xF0, 0x00);     // BEQ done (patch offset later)
            code.push(0xAA);           // TAX = count
            // advance src
            code.push(0xE6, 0xFD);
            code.push(0xD0, 0x02);
            code.push(0xE6, 0xFE);
            code.push(0xB1, 0xFD);     // LDA ($FD),Y  — value
            // advance src
            code.push(0xE6, 0xFD);
            code.push(0xD0, 0x02);
            code.push(0xE6, 0xFE);
            // copy loop
            const copyTop = code.length;
            code.push(0x91, 0xFB);     // STA ($FB),Y
            code.push(0xE6, 0xFB);
            code.push(0xD0, 0x02);
            code.push(0xE6, 0xFC);
            code.push(0xCA);           // DEX
            code.push(0xD0, (copyTop - (code.length + 2)) & 0xFF); // BNE copyTop
            code.push(0xF0, (loopTop - (code.length + 2)) & 0xFF); // BEQ loopTop (Z set from DEX=0)
            // done label
            code[beqPatch + 1] = (code.length - (beqPatch + 2)) & 0xFF;

            return { srcLoPatch, srcHiPatch };
        }

        // ── 1. Set border + background colors ──
        code.push(0xA9, borderColor & 0x0F);
        code.push(0x8D, 0x20, 0xD0);          // STA $D020
        code.push(0xA9, bgColor & 0x0F);
        code.push(0x8D, 0x21, 0xD0);          // STA $D021

        // ── 2. Clear screen (fill $0400-$07E7 with spaces) ──
        code.push(0xA9, 0x20);                // LDA #$20
        code.push(0xA2, 0x00);                // LDX #0
        const clrLoop = code.length;
        code.push(0x9D, 0x00, 0x04);          // STA $0400,X
        code.push(0x9D, 0x00, 0x05);          // STA $0500,X
        code.push(0x9D, 0x00, 0x06);          // STA $0600,X
        code.push(0x9D, 0xE8, 0x06);          // STA $06E8,X
        code.push(0xE8);                       // INX (0→1→2→...→255→0, covers all 256 indices)
        code.push(0xD0, (clrLoop - (code.length + 2)) & 0xFF); // BNE clrLoop

        // ── 3. Decompress screen data to $0400 ──
        const scrPatches = emitDecomp(0x04);

        // ── 4. Decompress color data to $D800 ──
        const colPatches = emitDecomp(0xD8);

        // ── 5. Set cursor position for BASIC's READY. ──
        // $D6 = cursor row, $D3 = cursor column
        // $0286 = current text/cursor color
        code.push(0xA9, cursorRow & 0xFF);     // LDA #cursorRow
        code.push(0x85, 0xD6);                 // STA $D6
        code.push(0xA9, 0x00);                 // LDA #0 (column 0)
        code.push(0x85, 0xD3);                 // STA $D3

        // ── 6. Set text color for READY. ──
        code.push(0xA9, readyColor & 0x0F);   // LDA #readyColor
        code.push(0x8D, 0x86, 0x02);          // STA $0286

        // ── 7. JMP $A644 (BASIC warm start — prints READY. then input loop) ──
        code.push(0x4C, 0x44, 0xA6);          // JMP $A644

        // ── Append compressed data ──
        const screenDataOffset = code.length;
        for (const b of compScreen) code.push(b);
        const colorDataOffset = code.length;
        for (const b of compColor) code.push(b);

        // ── Patch source pointers ──
        const scrAddr = BASE + screenDataOffset;
        code[scrPatches.srcLoPatch] = scrAddr & 0xFF;
        code[scrPatches.srcHiPatch] = (scrAddr >> 8) & 0xFF;

        const colAddr = BASE + colorDataOffset;
        code[colPatches.srcLoPatch] = colAddr & 0xFF;
        code[colPatches.srcHiPatch] = (colAddr >> 8) & 0xFF;

        return code;
    }

    // ── RLE Compression ─────────────────────────────────────────────────

    _rleCompress(data) {
        const result = [];
        let i = 0;

        while (i < data.length) {
            const current = data[i];
            let count = 1;

            // Count consecutive identical bytes (max 255)
            while (i + count < data.length && data[i + count] === current && count < 255) {
                count++;
            }

            result.push(count, current);
            i += count;
        }

        // End marker
        result.push(0);
        return result;
    }

    // ── Download ROM ────────────────────────────────────────────────────

    downloadROM(romData, filename) {
        const blob = new Blob([romData], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'kernal-custom.bin';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    downloadChargen(chargenData, filename) {
        const blob = new Blob([chargenData], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'chargen-custom.bin';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ── Export as .PRG ──────────────────────────────────────────────────

    exportPRG(screenState) {
        // Creates a C64 .PRG file that displays the boot screen
        // Load address: $0801 (BASIC start)
        // Contains a BASIC stub (SYS 2064) + machine code

        const { screen, color, borderColor, bgColor } = screenState;

        const compScreen = this._rleCompress(screen);
        const compColor = this._rleCompress(color);

        // BASIC stub: 10 SYS 2064
        const basic = [
            0x01, 0x08, // Load address: $0801
            0x0C, 0x08, // Next line pointer: $080C
            0x0A, 0x00, // Line number: 10
            0x9E,       // SYS token
            0x32, 0x30, 0x36, 0x34, // "2064"
            0x00,       // End of line
            0x00, 0x00, // End of program
        ];

        // Machine code at $0810
        const code = [];

        // RLE decompressor helper (same logic as _buildInitCode)
        function emitDecomp(destHigh) {
            code.push(0xA9, 0x00);
            code.push(0x85, 0xFB);
            code.push(0xA9, destHigh);
            code.push(0x85, 0xFC);
            const srcLoPatch = code.length + 1;
            code.push(0xA9, 0x00);
            code.push(0x85, 0xFD);
            const srcHiPatch = code.length + 1;
            code.push(0xA9, 0x00);
            code.push(0x85, 0xFE);
            const loopTop = code.length;
            code.push(0xA0, 0x00);
            code.push(0xB1, 0xFD);
            const beqPatch = code.length;
            code.push(0xF0, 0x00);
            code.push(0xAA);
            code.push(0xE6, 0xFD);
            code.push(0xD0, 0x02);
            code.push(0xE6, 0xFE);
            code.push(0xB1, 0xFD);
            code.push(0xE6, 0xFD);
            code.push(0xD0, 0x02);
            code.push(0xE6, 0xFE);
            const copyTop = code.length;
            code.push(0x91, 0xFB);
            code.push(0xE6, 0xFB);
            code.push(0xD0, 0x02);
            code.push(0xE6, 0xFC);
            code.push(0xCA);
            code.push(0xD0, (copyTop - (code.length + 2)) & 0xFF);
            code.push(0xF0, (loopTop - (code.length + 2)) & 0xFF);
            code[beqPatch + 1] = (code.length - (beqPatch + 2)) & 0xFF;
            return { srcLoPatch, srcHiPatch };
        }

        // SEI - disable interrupts during screen update
        code.push(0x78);

        // Set colors
        code.push(0xA9, borderColor & 0x0F);
        code.push(0x8D, 0x20, 0xD0);
        code.push(0xA9, bgColor & 0x0F);
        code.push(0x8D, 0x21, 0xD0);

        // Clear screen with spaces (INX from 0 wraps through 1-255 back to 0)
        code.push(0xA9, 0x20);
        code.push(0xA2, 0x00);
        const clrLoop = code.length;
        code.push(0x9D, 0x00, 0x04);
        code.push(0x9D, 0x00, 0x05);
        code.push(0x9D, 0x00, 0x06);
        code.push(0x9D, 0xE8, 0x06);
        code.push(0xE8);
        code.push(0xD0, (clrLoop - (code.length + 2)) & 0xFF);

        // Decompress screen data to $0400
        const scrPatches = emitDecomp(0x04);

        // Decompress color data to $D800
        const colPatches = emitDecomp(0xD8);

        // CLI - re-enable interrupts
        code.push(0x58);

        // Wait for keypress: JSR $FFE4 (GETIN), BEQ loop
        const getinLoop = code.length;
        code.push(0x20, 0xE4, 0xFF);
        code.push(0xF0, (getinLoop - (code.length + 2)) & 0xFF);

        // RTS
        code.push(0x60);

        // Append data
        const screenDataOffset = code.length;
        for (const b of compScreen) code.push(b);
        const colorDataOffset = code.length;
        for (const b of compColor) code.push(b);

        // Patch data addresses (base = $0810)
        const baseAddr = 0x0810;
        const scrAddr = baseAddr + screenDataOffset;
        const colAddr = baseAddr + colorDataOffset;

        code[scrPatches.srcLoPatch] = scrAddr & 0xFF;
        code[scrPatches.srcHiPatch] = (scrAddr >> 8) & 0xFF;
        code[colPatches.srcLoPatch] = colAddr & 0xFF;
        code[colPatches.srcHiPatch] = (colAddr >> 8) & 0xFF;

        // Combine BASIC stub + code
        const prg = new Uint8Array(basic.length + code.length);
        prg.set(basic);
        prg.set(code, basic.length);

        return prg;
    }

    downloadPRG(screenState, filename) {
        const prg = this.exportPRG(screenState);
        const blob = new Blob([prg], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'bootscreen.prg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ── Import/Export Screen Design as JSON ──────────────────────────────

    exportJSON(screenState) {
        return JSON.stringify(screenState, null, 2);
    }

    importJSON(jsonStr) {
        const state = JSON.parse(jsonStr);
        if (!state.screen || !state.color || state.screen.length !== C64.SCREEN_SIZE) {
            throw new Error('Invalid screen design file');
        }
        // Clamp color values to valid range
        for (let i = 0; i < state.color.length; i++) {
            state.color[i] = (state.color[i] || 0) & 0x0F;
        }
        for (let i = 0; i < state.screen.length; i++) {
            state.screen[i] = (state.screen[i] || 0) & 0xFF;
        }
        if (state.borderColor !== undefined) state.borderColor = (state.borderColor || 0) & 0x0F;
        if (state.bgColor !== undefined) state.bgColor = (state.bgColor || 0) & 0x0F;
        return state;
    }
}

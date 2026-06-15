/**
 * C64 Boot Screen Editor - KERNAL ROM Patcher
 * Handles: reading ROMs, simple text/color patching, extended PETSCII screen injection
 */
class RomPatcher {
    /**
     * Creates a new RomPatcher instance.
     */
    constructor() {
        this.romData = null;      // Uint8Array of KERNAL ROM
        this.romFileName = '';
        this.chargenData = null;  // Uint8Array of chargen ROM
        this.chargenFileName = '';
    }

    // ── ROM Loading ─────────────────────────────────────────────────────

    /**
     * Loads a KERNAL ROM file for patching.
     * @param {File} file - The KERNAL ROM file to load
     * @returns {Promise<Object>} Promise that resolves with ROM info
     */
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

    /**
     * Loads a character ROM (chargen) file for editing.
     * @param {File} file - The chargen ROM file to load (must be 4096 bytes)
     * @returns {Promise<Uint8Array>} Promise that resolves with the chargen data
     */
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

    /**
     * Patches the KERNAL ROM with simple text and color changes.
     * Updates the two banner lines, border color, background color, and text color.
     * @param {string} [line1] - First banner line text (max 35 chars)
     * @param {string} [line2] - Second banner line text (max 16 chars)
     * @param {number} [borderColor] - Border color index (0-15)
     * @param {number} [bgColor] - Background color index (0-15)
     * @param {number} [textColor] - Text color index (0-15)
     * @returns {Uint8Array} The patched ROM data
     */
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
        // 37 bytes total: 35 chars of text + 2 CR bytes at end
        // Input is clamped to 35 chars, centered with spaces, then CR CR appended
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
        bytes[35] = 0x0D; // CR (carriage return)
        bytes[36] = 0x0D; // CR
        return bytes;
    }

    _padLine2(text) {
        // Line 2: " 64K RAM SYSTEM  " - 17 bytes, space-padded
        // Input is clamped to 16 chars, left-padded with space, then space-padded to 17
        const maxLen = 16; // leave room for leading space
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
    // KERNAL ROM Memory Layout (ROM loaded at $E000 in C64 memory):
    //
    // KERNAL startup flow (from ROM analysis at addresses $E394-$E39A):
    //   Address $E394 (ROM offset 0x0394): JSR $E453  (init BASIC vectors)
    //   Address $E397 (ROM offset 0x0397): JSR $E3BF  (init BASIC pointers)
    //   Address $E39A (ROM offset 0x039A): JSR $E422  (print banner + bytes free, then JMP $A644)
    //
    // $E422 routine (address $E422 = ROM offset 0x0422):
    //   Prints CLR screen + banner text via JSR $AB1E
    //   Calculates + prints free bytes
    //   Prints " BASIC BYTES FREE"
    //   JMP $A644 (BASIC warm start: prints "READY." + enters input loop)
    //
    // Patch Strategy:
    //   Our patch replaces JSR $E422 (3 bytes at ROM offset 0x039A) with JSR $EEBB
    //   We inject our custom code into the RS-232 NMI/Tx/Rx routines area at addresses $EEBB-$F0BC
    //   This corresponds to ROM offsets 0x0EBB-0x10BC (514 bytes available)
    //
    // SAFETY NOTES:
    //   The RS-232 routines at $EEBB-$F0BC are only active when RS-232 is open.
    //   They are NEVER called during the normal boot process, making this area safe for injection.
    //   WARNING: $E500-$E6FF (ROM offsets 0x0500-0x06FF) contains screen editor code (CINT at $E518)
    //   which IS called during boot — overwriting that area would crash before reaching our hook.
    //
    // Our injected code performs the following:
    //   1. Fills screen RAM ($0400-$07E7) with our compressed screen data
    //   2. Fills color RAM ($D800-$DBE7) with our compressed color data
    //   3. Sets border and background colors
    //   4. Positions cursor at the auto-detected row
    //   5. JMP $A644 to let BASIC print "READY." at our chosen position

    /**
     * Patches the KERNAL ROM with a full PETSCII screen design using extended mode.
     * Injects RLE-compressed screen data and custom 6502 code into the RS-232 safe area.
     * @param {Object} screenState - The screen state to inject
     * @param {Uint8Array|Array} screenState.screen - Screen codes (1000 elements)
     * @param {Uint8Array|Array} screenState.color - Color indices (1000 elements)
     * @param {number} [screenState.borderColor] - Border color (0-15)
     * @param {number} [screenState.bgColor] - Background color (0-15)
     * @returns {Uint8Array} The patched ROM data with injected screen
     * @throws {Error} If screen data is too large for the injection area
     */
    patchExtended(screenState) {
        if (!this.romData) throw new Error('No KERNAL ROM loaded');

        const rom = new Uint8Array(this.romData); // work on copy
        const { screen, color, borderColor, bgColor } = screenState;

        // Find where READY. should go - scan for last non-space row
        let cursorRow = 0;
        for (let row = C64.SCREEN_ROWS - 1; row >= 0; row--) {
            let hasContent = false;
            for (let col = 0; col < C64.SCREEN_COLS; col++) {
                if (screen[row * C64.SCREEN_COLS + col] !== C64.SCREEN_CODE_SPACE) { hasContent = true; break; }
            }
            if (hasContent) {
                cursorRow = Math.min(row + 1, C64.SCREEN_ROWS - 1);
                break;
            }
        }

        // Text color for READY. - use the most common color in the design
        const colorCounts = new Array(16).fill(0);
        for (let i = 0; i < C64.SCREEN_SIZE; i++) {
            if (screen[i] !== C64.SCREEN_CODE_SPACE) colorCounts[color[i]]++;
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

        // Inject into RS-232 area: offset $0EBB (address $EEBB)
        // RS-232 Tx/Rx NMI handlers — only active when RS-232 is open,
        // never called during boot. Safe range: $EEBB-$F0BC (514 bytes).
        const injectOffset = 0x0EBB;
        const injectAddr = 0xEEBB;
        const availableSpace = 0xF0BC - 0xEEBB + 1; // 514 bytes
        if (initCode.length > availableSpace) {
            throw new Error(`Screen data too large: ${initCode.length} bytes (max ${availableSpace}). Try simplifying your design — use fewer unique characters or colors.`);
        }

        for (let i = 0; i < initCode.length; i++) {
            rom[injectOffset + i] = initCode[i];
        }

        // Hook: Replace JSR $E422 (3 bytes at ROM offset 0x039A-0x039C) with JSR $EEBB
        // Original bytes at 0x039A: 0x20 0x22 0xE4 (JSR $E422)
        // New bytes:              0x20 0xBB 0xEE (JSR $EEBB)
        rom[0x039A] = 0x20;                        // JSR opcode
        rom[0x039B] = injectAddr & 0xFF;            // low byte of target address ($BB)
        rom[0x039C] = (injectAddr >> 8) & 0xFF;     // high byte of target address ($EE)

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

        const BASE = 0xEEBB;
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

    /**
     * Downloads a ROM file to the user's browser.
     * @param {Uint8Array} romData - The ROM data to download
     * @param {string} [filename] - The filename for the download (default: 'kernal-custom.bin')
     */
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

    /**
     * Downloads a chargen ROM file to the user's browser.
     * @param {Uint8Array} chargenData - The chargen ROM data to download
     * @param {string} [filename] - The filename for the download (default: 'chargen-custom.bin')
     */
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

    _exportPRG(screenState) {
        // Creates a C64 .PRG file that displays the boot screen
        // Load address: $0801 (BASIC start)
        // Contains a BASIC stub (SYS 2064) + machine code

        const { screen, color, borderColor, bgColor } = screenState;

        const compScreen = this._rleCompress(screen);
        const compColor = this._rleCompress(color);

        // BASIC stub: 10 SYS 2064
        // Must be exactly 17 bytes so machine code starts at $0810
        const basic = [
            0x01, 0x08, // PRG header: load at $0801
            0x0B, 0x08, // Next BASIC line pointer: $080B
            0x0A, 0x00, // Line number: 10
            0x9E,       // SYS token
            0x32, 0x30, 0x36, 0x34, // "2064"
            0x00,       // End of line
            0x00, 0x00, // End of BASIC program (at $080B)
            0x00, 0x00, 0x00, // Padding to reach $0810
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

    /**
     * Downloads a C64 PRG file that displays the boot screen when loaded.
     * @param {Object} screenState - The screen state to export
     * @param {string} [filename] - The filename for the download (default: 'bootscreen.prg')
     */
    downloadPRG(screenState, filename) {
        const prg = this._exportPRG(screenState);
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

    /**
     * Imports a screen design from a JSON string.
     * Validates the structure and clamps all values to valid ranges.
     * @param {string} jsonStr - The JSON string containing the screen design
     * @returns {Object} The parsed and validated screen state
     * @property {Array} screen - Screen codes (1000 elements, 0-255)
     * @property {Array} color - Color indices (1000 elements, 0-15)
     * @property {number} [borderColor] - Border color (0-15)
     * @property {number} [bgColor] - Background color (0-15)
     * @throws {Error} If JSON is invalid or structure is incorrect
     */
    importJSON(jsonStr) {
        let state;
        try {
            state = JSON.parse(jsonStr);
        } catch (e) {
            throw new Error('Invalid JSON: ' + e.message);
        }
        
        // Validate required fields
        if (!state || typeof state !== 'object') {
            throw new Error('Invalid screen design file: not an object');
        }
        if (!Array.isArray(state.screen) || !Array.isArray(state.color)) {
            throw new Error('Invalid screen design file: screen and color must be arrays');
        }
        if (state.screen.length !== C64.SCREEN_SIZE) {
            throw new Error(`Invalid screen size: ${state.screen.length} (expected ${C64.SCREEN_SIZE})`);
        }
        if (state.color.length !== C64.SCREEN_SIZE) {
            throw new Error(`Invalid color data length: ${state.color.length} (expected ${C64.SCREEN_SIZE})`);
        }
        
        // Validate and clamp color values to valid range (0-15)
        for (let i = 0; i < state.color.length; i++) {
            if (typeof state.color[i] !== 'number') {
                throw new Error(`Invalid color at position ${i}: must be a number`);
            }
            state.color[i] = Math.min(Math.max(0, Math.floor(state.color[i])), 0x0F);
        }
        
        // Validate and clamp screen values to valid range (0-255)
        for (let i = 0; i < state.screen.length; i++) {
            if (typeof state.screen[i] !== 'number') {
                throw new Error(`Invalid screen code at position ${i}: must be a number`);
            }
            state.screen[i] = Math.min(Math.max(0, Math.floor(state.screen[i])), 0xFF);
        }
        
        // Validate optional fields
        if (state.borderColor !== undefined) {
            if (typeof state.borderColor !== 'number') {
                throw new Error('Invalid borderColor: must be a number');
            }
            state.borderColor = Math.min(Math.max(0, Math.floor(state.borderColor)), 0x0F);
        }
        if (state.bgColor !== undefined) {
            if (typeof state.bgColor !== 'number') {
                throw new Error('Invalid bgColor: must be a number');
            }
            state.bgColor = Math.min(Math.max(0, Math.floor(state.bgColor)), 0x0F);
        }
        
        return state;
    }

    // ── Import PRG Files ────────────────────────────────────────────────────

    /**
     * Imports a C64 PRG file containing screen data.
     * Supports Kaleidoscope exports and other standard PRG formats.
     * @param {File} file - The PRG file to import
     * @returns {Promise<Object>} Promise that resolves with screen state
     */
    importPRG(file) {
        // Safety check: ensure C64 constants are available
        if (typeof C64 === 'undefined' || !C64.SCREEN_SIZE || !C64.COLORS) {
            return Promise.reject(new Error('C64 constants not loaded'));
        }
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    
                    // PRG format: first 2 bytes = load address
                    if (data.length < 2) {
                        throw new Error('Invalid PRG file: too small');
                    }
                    
                    const loadAddr = (data[1] << 8) | data[0];
                    const prgData = data.slice(2);
                    
                    let screenData = null;
                    let colorData = null;
                    let borderColor = null;
                    let bgColor = null;
                    
                    // Handle different PRG formats
                    if (loadAddr === 0x0400 && prgData.length >= 2000) {
                        // Standard format: screen at $0400 + color at $D800
                        screenData = prgData.slice(0, C64.SCREEN_SIZE);
                        colorData = prgData.slice(C64.SCREEN_SIZE, C64.SCREEN_SIZE * 2);
                        
                        // Optional border/bg colors at end
                        if (prgData.length >= 2002) {
                            borderColor = prgData[2000];
                            bgColor = prgData[2001];
                        }
                    } else if (loadAddr === 0x2000 && prgData.length >= 2000) {
                        // Alternative format starting at $2000
                        // Some tools store screen+color sequentially
                        screenData = prgData.slice(0, C64.SCREEN_SIZE);
                        colorData = prgData.slice(C64.SCREEN_SIZE, C64.SCREEN_SIZE * 2);
                    } else if (prgData.length === C64.SCREEN_SIZE) {
                        // Screen data only (no colors)
                        screenData = prgData.slice(0, C64.SCREEN_SIZE);
                        colorData = new Uint8Array(C64.SCREEN_SIZE);
                    } else if (prgData.length >= C64.SCREEN_SIZE) {
                        // Try to extract screen data from whatever is there
                        screenData = prgData.slice(0, C64.SCREEN_SIZE);
                        if (prgData.length >= C64.SCREEN_SIZE * 2) {
                            colorData = prgData.slice(C64.SCREEN_SIZE, C64.SCREEN_SIZE * 2);
                        }
                    }
                    
                    if (!screenData) {
                        throw new Error(`Unsupported PRG format: load address $${loadAddr.toString(16).toUpperCase()}, size ${prgData.length}`);
                    }
                    
                    // Ensure we have color data
                    if (!colorData) {
                        colorData = new Uint8Array(C64.SCREEN_SIZE);
                    }
                    
                    // Validate screen data
                    if (screenData.length !== C64.SCREEN_SIZE) {
                        throw new Error(`Invalid screen size: ${screenData.length} (expected ${C64.SCREEN_SIZE})`);
                    }
                    
                    // Clamp color values to 0-15
                    for (let i = 0; i < colorData.length; i++) {
                        colorData[i] = (colorData[i] || 0) & 0x0F;
                    }
                    
                    // Set defaults if border/bg colors not in file
                    if (borderColor === null || borderColor === undefined) {
                        borderColor = 6; // Default: blue (common C64 border)
                    } else {
                        borderColor = borderColor & 0x0F;
                    }
                    if (bgColor === null || bgColor === undefined) {
                        bgColor = 0; // Default: black
                    } else {
                        bgColor = bgColor & 0x0F;
                    }
                    
                    resolve({
                        screen: Array.from(screenData),
                        color: Array.from(colorData),
                        borderColor: borderColor,
                        bgColor: bgColor
                    });
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read PRG file'));
            reader.readAsArrayBuffer(file);
        });
    }

    // ── Import SEQ Files ────────────────────────────────────────────────────

    /**
     * Imports a C64 SEQ file containing screen data.
     * Supports Kaleidoscope exports and standard SEQ formats.
     * @param {File} file - The SEQ file to import
     * @returns {Promise<Object>} Promise that resolves with screen state
     */
    importSEQ(file) {
        // Safety check: ensure C64 constants are available
        if (typeof C64 === 'undefined' || !C64.SCREEN_SIZE || !C64.COLORS) {
            return Promise.reject(new Error('C64 constants not loaded'));
        }
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    
                    let screenData = null;
                    let colorData = null;
                    
                    if (data.length >= C64.SCREEN_SIZE * 2) {
                        // Standard SEQ: screen + color
                        screenData = data.slice(0, C64.SCREEN_SIZE);
                        colorData = data.slice(C64.SCREEN_SIZE, C64.SCREEN_SIZE * 2);
                    } else if (data.length === C64.SCREEN_SIZE) {
                        // Screen only
                        screenData = data.slice(0, C64.SCREEN_SIZE);
                        colorData = new Uint8Array(C64.SCREEN_SIZE);
                    } else {
                        throw new Error(`Invalid SEQ file size: ${data.length} (expected ${C64.SCREEN_SIZE} or ${C64.SCREEN_SIZE * 2})`);
                    }
                    
                    // Validate screen data
                    if (screenData.length !== C64.SCREEN_SIZE) {
                        throw new Error(`Invalid screen size: ${screenData.length} (expected ${C64.SCREEN_SIZE})`);
                    }
                    
                    // Ensure we have color data
                    if (!colorData || colorData.length !== C64.SCREEN_SIZE) {
                        colorData = new Uint8Array(C64.SCREEN_SIZE);
                    }
                    
                    // Clamp color values to 0-15
                    for (let i = 0; i < colorData.length; i++) {
                        colorData[i] = (colorData[i] || 0) & 0x0F;
                    }
                    
                    // SEQ files don't include border/bg colors, use defaults
                    resolve({
                        screen: Array.from(screenData),
                        color: Array.from(colorData),
                        borderColor: 6,  // Default: blue
                        bgColor: 0       // Default: black
                    });
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read SEQ file'));
            reader.readAsArrayBuffer(file);
        });
    }
}

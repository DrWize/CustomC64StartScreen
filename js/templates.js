// C64 Boot Screen Editor - Pre-made Boot Screen Templates
// Each template defines: screen codes, color data, border color, background color
// NOTE: Templates should NOT include "READY." — BASIC prints that automatically at boot.

const Templates = (() => {

    // Helper: create a 1000-element array filled with a value
    function fill(val) { return new Array(1000).fill(val); }

    // Helper: set text at a specific row/col position
    function setText(screen, color, row, col, text, textColor) {
        for (let i = 0; i < text.length && col + i < 40; i++) {
            const idx = row * 40 + col + i;
            screen[idx] = C64.asciiToScreenCode(text.charCodeAt(i));
            if (textColor !== undefined) color[idx] = textColor;
        }
    }

    // Helper: draw horizontal line
    function hLine(screen, color, row, col, len, char, lineColor) {
        for (let i = 0; i < len && col + i < 40; i++) {
            const idx = row * 40 + col + i;
            screen[idx] = char;
            if (lineColor !== undefined) color[idx] = lineColor;
        }
    }

    // Helper: draw vertical line
    function vLine(screen, color, col, row, len, char, lineColor) {
        for (let i = 0; i < len && row + i < 25; i++) {
            const idx = (row + i) * 40 + col;
            screen[idx] = char;
            if (lineColor !== undefined) color[idx] = lineColor;
        }
    }

    // ── Template: Classic C64 ───────────────────────────────────────────
    function classic() {
        const screen = fill(32);
        const color = fill(14);

        setText(screen, color, 1, 4, '**** COMMODORE 64 BASIC V2 ****', 14);
        setText(screen, color, 3, 1, '64K RAM SYSTEM  38911 BASIC BYTES FREE', 14);

        return {
            name: 'Classic C64',
            description: 'Default Commodore 64 boot screen',
            screen, color,
            borderColor: 14,
            bgColor: 6,
        };
    }

    // ── Template: Dark Mode ─────────────────────────────────────────────
    function darkMode() {
        const screen = fill(32);
        const color = fill(15);

        setText(screen, color, 1, 4, '**** COMMODORE 64 BASIC V2 ****', 15);
        setText(screen, color, 3, 1, '64K RAM SYSTEM  38911 BASIC BYTES FREE', 12);

        return {
            name: 'Dark Mode',
            description: 'Dark theme with grey tones',
            screen, color,
            borderColor: 0,
            bgColor: 0,
        };
    }

    // ── Template: Hacker Green ──────────────────────────────────────────
    function hackerGreen() {
        const screen = fill(32);
        const color = fill(5);

        setText(screen, color, 1, 4, '**** COMMODORE 64 BASIC V2 ****', 13);
        setText(screen, color, 3, 1, '64K RAM SYSTEM  38911 BASIC BYTES FREE', 5);

        return {
            name: 'Hacker Green',
            description: 'Green on black terminal look',
            screen, color,
            borderColor: 0,
            bgColor: 0,
        };
    }

    // ── Template: C= Logo ───────────────────────────────────────────────
    function commodoreLogo() {
        const screen = fill(32);
        const color = fill(1);

        // Color stripe at top (red, white, blue feel)
        for (let col = 0; col < 40; col++) {
            screen[2 * 40 + col] = 160; // reverse space (full block)
            color[2 * 40 + col] = 2;    // red
            screen[3 * 40 + col] = 160;
            color[3 * 40 + col] = 1;    // white
            screen[4 * 40 + col] = 160;
            color[4 * 40 + col] = 14;   // light blue
        }

        setText(screen, color, 7, 12, 'COMMODORE 64', 1);
        setText(screen, color, 10, 4, '**** COMMODORE 64 BASIC V2 ****', 14);
        setText(screen, color, 12, 1, '64K RAM SYSTEM  38911 BASIC BYTES FREE', 14);

        return {
            name: 'C= Logo Modern',
            description: 'Commodore logo with color stripes',
            screen, color,
            borderColor: 0,
            bgColor: 0,
        };
    }

    // ── Template: Rainbow ───────────────────────────────────────────────
    function rainbow() {
        const screen = fill(32);
        const color = fill(1);

        const rainbowColors = [2, 8, 7, 5, 14, 4];
        for (let i = 0; i < rainbowColors.length; i++) {
            for (let col = 0; col < 40; col++) {
                const idx = i * 40 + col;
                screen[idx] = 160;
                color[idx] = rainbowColors[i];
            }
        }

        setText(screen, color, 8, 14, 'COMMODORE 64', 1);
        setText(screen, color, 10, 4, '**** COMMODORE 64 BASIC V2 ****', 15);
        setText(screen, color, 12, 1, '64K RAM SYSTEM  38911 BASIC BYTES FREE', 12);

        return {
            name: 'Rainbow',
            description: 'Colorful rainbow stripes with white text',
            screen, color,
            borderColor: 0,
            bgColor: 0,
        };
    }

    // ── Template: Retro Terminal ─────────────────────────────────────────
    function retroTerminal() {
        const screen = fill(32);
        const color = fill(8);

        setText(screen, color, 0, 0, '========================================', 8);
        setText(screen, color, 1, 12, '> SYSTEM BOOT <', 8);
        setText(screen, color, 2, 0, '========================================', 8);
        setText(screen, color, 4, 0, 'INITIALIZING HARDWARE...         [ OK ]', 8);
        setText(screen, color, 5, 0, 'MEMORY TEST: 64K RAM             [ OK ]', 8);
        setText(screen, color, 6, 0, 'BASIC V2 LOADED                  [ OK ]', 8);
        setText(screen, color, 7, 0, '38911 BASIC BYTES FREE', 8);
        setText(screen, color, 9, 0, '========================================', 8);

        // Highlight [ OK ] in green
        for (let row = 4; row <= 6; row++) {
            for (let col = 35; col < 40; col++) {
                color[row * 40 + col] = 5;
            }
        }

        return {
            name: 'Retro Terminal',
            description: 'Boot log style with status indicators',
            screen, color,
            borderColor: 0,
            bgColor: 0,
        };
    }

    // ── Template: Blank ──────────────────────────────────────────────────
    function blank() {
        const screen = fill(32);
        const color = fill(1);
        return {
            name: 'Blank',
            description: 'Empty screen, just a cursor',
            screen, color,
            borderColor: 0,
            bgColor: 0,
        };
    }

    // ── Template: Underline ─────────────────────────────────────────────
    function underline() {
        const screen = fill(32);
        const color = fill(1);

        // Thin line at row 10
        for (let c = 4; c < 36; c++) {
            screen[10 * 40 + c] = 64;
            color[10 * 40 + c] = 12;
        }

        setText(screen, color, 12, 4, '**** COMMODORE 64 BASIC V2 ****', 1);
        setText(screen, color, 14, 1, '64K RAM SYSTEM  38911 BASIC BYTES FREE', 12);

        return {
            name: 'Underline',
            description: 'Clean text with subtle separator',
            screen, color,
            borderColor: 0,
            bgColor: 0,
        };
    }

    // ── Template: Color Bars ────────────────────────────────────────────
    function colorBars() {
        const screen = fill(32);
        const color = fill(1);

        const barColors = [1, 7, 3, 5, 4, 2, 6, 0];
        const barWidth = 5;
        for (let i = 0; i < 8; i++) {
            for (let r = 1; r <= 9; r++) {
                for (let c = 0; c < barWidth; c++) {
                    const idx = r * 40 + i * barWidth + c;
                    screen[idx] = 160;
                    color[idx] = barColors[i];
                }
            }
        }

        setText(screen, color, 12, 4, '**** COMMODORE 64 BASIC V2 ****', 1);
        setText(screen, color, 14, 1, '64K RAM SYSTEM  38911 BASIC BYTES FREE', 12);

        return {
            name: 'Color Bars',
            description: 'TV test pattern style',
            screen, color,
            borderColor: 11,
            bgColor: 0,
        };
    }

    // ── Template: C64 Ultimate ─────────────────────────────────────────
    function ultimate() {
        const screen = fill(32);
        const color = fill(14);

        for (let c = 0; c < 40; c++) {
            screen[1 * 40 + c] = 160; color[1 * 40 + c] = 2;
            screen[2 * 40 + c] = 160; color[2 * 40 + c] = 8;
            screen[3 * 40 + c] = 160; color[3 * 40 + c] = 7;
        }

        setText(screen, color, 5, 8, 'COMMODORE 64 ULTIMATE', 1);
        setText(screen, color, 8, 4, '**** COMMODORE 64 BASIC V2 ****', 14);
        setText(screen, color, 10, 1, '64K RAM SYSTEM  38911 BASIC BYTES FREE', 14);

        return {
            name: 'C64 Ultimate',
            description: 'Ultimate edition with color stripe',
            screen, color,
            borderColor: 14,
            bgColor: 6,
        };
    }

    // ── Template: C64 Ultimate Dark ─────────────────────────────────────
    function ultimateDark() {
        const screen = fill(32);
        const color = fill(12);

        for (let c = 0; c < 40; c++) {
            screen[3 * 40 + c] = 64;
            color[3 * 40 + c] = 14;
        }

        setText(screen, color, 1, 9, 'COMMODORE 64 ULTIMATE', 1);
        setText(screen, color, 2, 15, 'EDITION', 12);
        setText(screen, color, 5, 4, '**** COMMODORE 64 BASIC V2 ****', 15);
        setText(screen, color, 7, 1, '64K RAM SYSTEM  38911 BASIC BYTES FREE', 12);

        return {
            name: 'C64 Ultimate Dark',
            description: 'Ultimate edition, sleek dark theme',
            screen, color,
            borderColor: 0,
            bgColor: 0,
        };
    }

    // ── Template: C64 Ultimate Gold ─────────────────────────────────────
    function ultimateGold() {
        const screen = fill(32);
        const color = fill(7);

        for (let c = 0; c < 40; c++) {
            screen[0 * 40 + c] = 160; color[0 * 40 + c] = 7;
            screen[1 * 40 + c] = 160; color[1 * 40 + c] = 8;
            screen[23 * 40 + c] = 160; color[23 * 40 + c] = 8;
            screen[24 * 40 + c] = 160; color[24 * 40 + c] = 7;
        }

        setText(screen, color, 4, 9, 'COMMODORE 64 ULTIMATE', 7);
        setText(screen, color, 5, 14, 'FOUNDERS', 8);
        setText(screen, color, 8, 4, '**** COMMODORE 64 BASIC V2 ****', 7);
        setText(screen, color, 10, 1, '64K RAM SYSTEM  38911 BASIC BYTES FREE', 8);

        return {
            name: 'C64 Ultimate Gold',
            description: 'Founders edition, gold on black',
            screen, color,
            borderColor: 9,
            bgColor: 0,
        };
    }

    // ── Template: C64 Ultimate Starlight ─────────────────────────────────
    function ultimateStarlight() {
        const screen = fill(32);
        const color = fill(14);

        const title = 'COMMODORE 64 ULTIMATE';
        const titleColors = [2, 8, 7, 13, 5, 3, 14, 4, 2, 8, 7, 13, 5, 3, 14, 4, 2, 8, 7, 13, 5];
        const startCol = Math.floor((40 - title.length) / 2);
        for (let i = 0; i < title.length; i++) {
            const idx = 3 * 40 + startCol + i;
            screen[idx] = C64.asciiToScreenCode(title.charCodeAt(i));
            color[idx] = titleColors[i % titleColors.length];
        }

        setText(screen, color, 6, 4, '**** COMMODORE 64 BASIC V2 ****', 14);
        setText(screen, color, 8, 1, '64K RAM SYSTEM  38911 BASIC BYTES FREE', 15);

        return {
            name: 'C64 Ultimate Starlight',
            description: 'Colorful rainbow text edition',
            screen, color,
            borderColor: 0,
            bgColor: 0,
        };
    }

    // ── All templates ───────────────────────────────────────────────────
    const ALL = [
        classic,
        darkMode,
        hackerGreen,
        commodoreLogo,
        rainbow,
        retroTerminal,
        blank,
        underline,
        colorBars,
        ultimate,
        ultimateDark,
        ultimateGold,
        ultimateStarlight,
    ];

    function getAll() {
        return ALL.map(fn => fn());
    }

    function getByName(name) {
        const template = ALL.find(fn => fn().name === name);
        return template ? template() : null;
    }

    return { getAll, getByName };
})();

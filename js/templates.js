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

        const rng = (s) => { s = (s * 1103515245 + 12345) & 0x7FFFFFFF; return s; };
        let seed = 77;
        for (let i = 0; i < 30; i++) {
            seed = rng(seed);
            const r = seed % 25;
            seed = rng(seed);
            const c = seed % 40;
            const idx = r * 40 + c;
            if (screen[idx] === 32) {
                screen[idx] = 46;
                seed = rng(seed);
                color[idx] = [2, 8, 7, 5, 3, 14, 4][seed % 7];
            }
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

    // ── Flag helper: fill a rectangular block with a color ────────────
    function fillBlock(screen, color, startRow, startCol, rows, cols, charCode, blockColor) {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const idx = (startRow + r) * 40 + (startCol + c);
                if (idx < 1000) {
                    screen[idx] = charCode;
                    color[idx] = blockColor;
                }
            }
        }
    }

    // Flag template factory
    function makeFlag(name, description, flagDef, borderCol, bgCol) {
        return function() {
            const screen = fill(32);
            const color = fill(1);
            const B = 160; // full block (reverse space)

            // Draw flag in rows 1-9, cols 4-35 (32 wide x 9 tall)
            const fw = 32, fh = 9, fx = 4, fy = 1;

            if (flagDef.type === 'h-stripes') {
                let row = 0;
                for (const [c, h] of flagDef.stripes) {
                    fillBlock(screen, color, fy + row, fx, h, fw, B, c);
                    row += h;
                }
            } else if (flagDef.type === 'v-stripes') {
                let col = 0;
                for (const [c, w] of flagDef.stripes) {
                    fillBlock(screen, color, fy, fx + col, fh, w, B, c);
                    col += w;
                }
            } else if (flagDef.type === 'cross') {
                fillBlock(screen, color, fy, fx, fh, fw, B, flagDef.bg);
                fillBlock(screen, color, fy + 3, fx, flagDef.crossH || 3, fw, B, flagDef.cross);
                fillBlock(screen, color, fy, fx + 10, fh, flagDef.crossW || 3, B, flagDef.cross);
                if (flagDef.innerCross !== undefined) {
                    fillBlock(screen, color, fy + 4, fx, 1, fw, B, flagDef.innerCross);
                    fillBlock(screen, color, fy, fx + 11, fh, 1, B, flagDef.innerCross);
                }
            } else if (flagDef.type === 'custom') {
                flagDef.draw(screen, color, B, fy, fx, fh, fw);
            }

            // Country name + boot text below flag (no READY. — BASIC handles that)
            setText(screen, color, 11, Math.floor((40 - name.length) / 2), name, 1);
            setText(screen, color, 12, 4, '**** COMMODORE 64 BASIC V2 ****', 1);
            setText(screen, color, 14, 1, '64K RAM SYSTEM  38911 BASIC BYTES FREE', 15);

            return {
                name, description, screen, color,
                borderColor: borderCol !== undefined ? borderCol : 0,
                bgColor: bgCol !== undefined ? bgCol : 0,
                category: 'flag',
            };
        };
    }

    // ── Flag definitions ────────────────────────────────────────────────
    const flagSweden = makeFlag('Sweden', 'Swedish flag', {
        type: 'cross', bg: 6, cross: 7, crossH: 3, crossW: 3
    }, 6, 0);

    const flagNorway = makeFlag('Norway', 'Norwegian flag', {
        type: 'cross', bg: 2, cross: 1, crossH: 3, crossW: 3, innerCross: 6
    }, 2, 0);

    const flagFinland = makeFlag('Finland', 'Finnish flag', {
        type: 'cross', bg: 1, cross: 6, crossH: 3, crossW: 3
    }, 6, 0);

    const flagDenmark = makeFlag('Denmark', 'Danish flag', {
        type: 'cross', bg: 2, cross: 1, crossH: 1, crossW: 1
    }, 2, 0);

    const flagGermany = makeFlag('Germany', 'German flag', {
        type: 'h-stripes', stripes: [[0, 3], [2, 3], [7, 3]]
    }, 0, 0);

    const flagFrance = makeFlag('France', 'French tricolour', {
        type: 'v-stripes', stripes: [[6, 11], [1, 10], [2, 11]]
    }, 6, 0);

    const flagItaly = makeFlag('Italy', 'Italian tricolour', {
        type: 'v-stripes', stripes: [[5, 11], [1, 10], [2, 11]]
    }, 5, 0);

    const flagNetherlands = makeFlag('Netherlands', 'Dutch flag', {
        type: 'h-stripes', stripes: [[2, 3], [1, 3], [6, 3]]
    }, 6, 0);

    const flagUkraine = makeFlag('Ukraine', 'Ukrainian flag', {
        type: 'h-stripes', stripes: [[14, 5], [7, 4]]
    }, 14, 0);

    const flagUSA = makeFlag('USA', 'American flag', {
        type: 'custom',
        draw(screen, color, B, fy, fx, fh, fw) {
            for (let r = 0; r < fh; r++) {
                const stripeColor = (r % 2 === 0) ? 2 : 1;
                fillBlock(screen, color, fy + r, fx, 1, fw, B, stripeColor);
            }
            fillBlock(screen, color, fy, fx, 5, 14, B, 6);
            for (let r = 0; r < 5; r++) {
                for (let c = (r % 2); c < 14; c += 3) {
                    const idx = (fy + r) * 40 + fx + c;
                    screen[idx] = 46;
                    color[idx] = 1;
                }
            }
        }
    }, 6, 0);

    const flagUK = makeFlag('United Kingdom', 'Union Jack', {
        type: 'custom',
        draw(screen, color, B, fy, fx, fh, fw) {
            fillBlock(screen, color, fy, fx, fh, fw, B, 6);
            for (let r = 0; r < fh; r++) {
                const c1 = Math.round(r * fw / fh);
                const c2 = fw - 1 - c1;
                for (let w = -1; w <= 1; w++) {
                    if (c1+w >= 0 && c1+w < fw) { screen[(fy+r)*40+fx+c1+w] = B; color[(fy+r)*40+fx+c1+w] = 1; }
                    if (c2+w >= 0 && c2+w < fw) { screen[(fy+r)*40+fx+c2+w] = B; color[(fy+r)*40+fx+c2+w] = 1; }
                }
            }
            for (let r = 0; r < fh; r++) {
                const c1 = Math.round(r * fw / fh);
                const c2 = fw - 1 - c1;
                screen[(fy+r)*40+fx+c1] = B; color[(fy+r)*40+fx+c1] = 2;
                screen[(fy+r)*40+fx+c2] = B; color[(fy+r)*40+fx+c2] = 2;
            }
            fillBlock(screen, color, fy + 3, fx, 3, fw, B, 1);
            fillBlock(screen, color, fy, fx + 14, fh, 4, B, 1);
            fillBlock(screen, color, fy + 4, fx, 1, fw, B, 2);
            fillBlock(screen, color, fy, fx + 15, fh, 2, B, 2);
        }
    }, 6, 0);

    const flagJapan = makeFlag('Japan', 'Japanese flag', {
        type: 'custom',
        draw(screen, color, B, fy, fx, fh, fw) {
            fillBlock(screen, color, fy, fx, fh, fw, B, 1);
            const cx = 16, cy = 4, radius = 3;
            for (let r = 0; r < fh; r++) {
                for (let c = 0; c < fw; c++) {
                    const dx = (c - cx) * 0.55;
                    const dy = r - cy;
                    if (dx*dx + dy*dy <= radius*radius) {
                        screen[(fy+r)*40+fx+c] = B;
                        color[(fy+r)*40+fx+c] = 2;
                    }
                }
            }
        }
    }, 1, 0);

    const flagBrazil = makeFlag('Brazil', 'Brazilian flag', {
        type: 'custom',
        draw(screen, color, B, fy, fx, fh, fw) {
            fillBlock(screen, color, fy, fx, fh, fw, B, 5);
            const cx = 16, cy = 4;
            for (let r = 0; r < fh; r++) {
                const dy = Math.abs(r - cy);
                const halfW = Math.round((1 - dy / 4.5) * 14);
                if (halfW > 0) {
                    fillBlock(screen, color, fy + r, fx + cx - halfW, 1, halfW * 2 + 1, B, 7);
                }
            }
            for (let r = 0; r < fh; r++) {
                for (let c = 0; c < fw; c++) {
                    const dx = (c - cx) * 0.55;
                    const dy = r - cy;
                    if (dx*dx + dy*dy <= 2.2*2.2) {
                        screen[(fy+r)*40+fx+c] = B;
                        color[(fy+r)*40+fx+c] = 6;
                    }
                }
            }
        }
    }, 5, 0);

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

    const FLAGS = [
        flagSweden, flagNorway, flagFinland, flagDenmark,
        flagGermany, flagFrance, flagItaly, flagNetherlands,
        flagUkraine, flagUSA, flagUK, flagJapan, flagBrazil,
    ];

    function getAll() {
        return ALL.map(fn => fn());
    }

    function getFlags() {
        return FLAGS.map(fn => fn());
    }

    function getByName(name) {
        const all = [...ALL, ...FLAGS];
        const template = all.find(fn => fn().name === name);
        return template ? template() : null;
    }

    return { getAll, getFlags, getByName };
})();

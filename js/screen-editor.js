/**
 * C64 Boot Screen Editor - Canvas-based PETSCII Screen Editor
 * Renders a 40x25 character grid on HTML5 Canvas with per-cell color support.
 */
class ScreenEditor {
    /**
     * Creates a new ScreenEditor instance.
     * @param {string} canvasId - The ID of the canvas element to render to
     */
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.scale = 3; // pixel scale factor
        this.borderSize = 32; // border in scaled pixels

        // Screen data: 1000 cells
        this.screenData = new Uint8Array(C64.SCREEN_SIZE); // screen codes
        this.colorData = new Uint8Array(C64.SCREEN_SIZE);  // per-cell foreground color

        // Global colors
        this.borderColor = 14;  // light blue
        this.bgColor = 6;       // blue
        this.defaultTextColor = 14; // light blue

        // Editor state
        this.currentChar = C64.SCREEN_CODE_SPACE;    // space
        this.currentColor = 14;   // light blue
        this.currentTool = 'draw'; // draw, fill, text, colorpaint, rect, line, erase
        this.charSet = 0;         // 0 = uppercase/graphics, 1 = lowercase/uppercase
        this.isDrawing = false;
        this.textCursorPos = -1;
        this.showGrid = false;

        // Line/rect tool state
        this.lineStart = null;
        this.previewOverlay = null;

        // Undo/redo
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndo = 50;

        // Chargen ROM data
        this.chargenROM = C64.buildChargenROM();

        // Callbacks
        this.onCellHover = null;
        this.onScreenChange = null;

        this._setupCanvas();
        this._setupEvents();
        this.clearScreen();
    }

    _setupCanvas() {
        const w = C64.SCREEN_COLS * C64.CHAR_WIDTH * this.scale + this.borderSize * 2;
        const h = C64.SCREEN_ROWS * C64.CHAR_HEIGHT * this.scale + this.borderSize * 2;
        this.canvas.width = w;
        this.canvas.height = h;
        this.canvas.style.cursor = 'crosshair';
        this.ctx.imageSmoothingEnabled = false;
    }

    _setupEvents() {
        this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this._onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this._onMouseUp());
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        document.addEventListener('keydown', (e) => {
            if (this.currentTool === 'text' && this.textCursorPos >= 0) {
                this._onTextKey(e);
            }
        });
    }

    _getCellFromMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX - this.borderSize;
        const y = (e.clientY - rect.top) * scaleY - this.borderSize;
        const col = Math.floor(x / (C64.CHAR_WIDTH * this.scale));
        const row = Math.floor(y / (C64.CHAR_HEIGHT * this.scale));
        if (col >= 0 && col < C64.SCREEN_COLS && row >= 0 && row < C64.SCREEN_ROWS) {
            return { col, row, idx: row * C64.SCREEN_COLS + col };
        }
        return null;
    }

    _onMouseDown(e) {
        const cell = this._getCellFromMouse(e);
        if (!cell) return;

        // Update hover position on click too (for row operations)
        if (this.onCellHover) {
            this.onCellHover(cell.col, cell.row, this.screenData[cell.idx], this.colorData[cell.idx]);
        }

        if (e.button === 2) {
            // Right-click: pick character and color from cell
            this.currentChar = this.screenData[cell.idx];
            this.currentColor = this.colorData[cell.idx];
            if (this.onScreenChange) this.onScreenChange();
            return;
        }

        this._saveUndo();

        switch (this.currentTool) {
            case 'draw':
                this.isDrawing = true;
                this._drawCell(cell);
                break;
            case 'erase':
                this.isDrawing = true;
                this._eraseCell(cell);
                break;
            case 'colorpaint':
                this.isDrawing = true;
                this.colorData[cell.idx] = this.currentColor;
                this.render();
                break;
            case 'fill':
                this._floodFill(cell);
                break;
            case 'text':
                this.textCursorPos = cell.idx;
                this.render();
                break;
            case 'line':
            case 'rect':
                this.isDrawing = true;
                this.lineStart = cell;
                this.previewOverlay = null;
                break;
        }
    }

    _onMouseMove(e) {
        const cell = this._getCellFromMouse(e);
        if (this.onCellHover && cell) {
            this.onCellHover(cell.col, cell.row, this.screenData[cell.idx], this.colorData[cell.idx]);
        }

        if (!this.isDrawing || !cell) return;

        switch (this.currentTool) {
            case 'draw':
                this._drawCell(cell);
                break;
            case 'erase':
                this._eraseCell(cell);
                break;
            case 'colorpaint':
                this.colorData[cell.idx] = this.currentColor;
                this.render();
                break;
            case 'line':
            case 'rect':
                this._updatePreview(cell);
                break;
        }
    }

    _onMouseUp() {
        if (!this.isDrawing) return;

        if ((this.currentTool === 'line' || this.currentTool === 'rect') && this.previewOverlay) {
            // Commit the preview
            for (const p of this.previewOverlay) {
                this.screenData[p.idx] = this.currentChar;
                this.colorData[p.idx] = this.currentColor;
            }
            this.previewOverlay = null;
            this.lineStart = null;
            this.render();
        }

        this.isDrawing = false;
    }

    _drawCell(cell) {
        // Bounds check
        if (cell.idx < 0 || cell.idx >= C64.SCREEN_SIZE) return;
        this.screenData[cell.idx] = this.currentChar;
        this.colorData[cell.idx] = this.currentColor;
        this.render();
    }

    _eraseCell(cell) {
        // Bounds check
        if (cell.idx < 0 || cell.idx >= C64.SCREEN_SIZE) return;
        this.screenData[cell.idx] = C64.SCREEN_CODE_SPACE; // space
        this.colorData[cell.idx] = this.currentColor;
        this.render();
    }

    _floodFill(cell) {
        const targetChar = this.screenData[cell.idx];
        const targetColor = this.colorData[cell.idx];
        if (targetChar === this.currentChar && targetColor === this.currentColor) return;

        const stack = [cell.idx];
        const visited = new Set();

        while (stack.length > 0) {
            const idx = stack.pop();
            if (visited.has(idx)) continue;
            if (idx < 0 || idx >= C64.SCREEN_SIZE) continue;
            if (this.screenData[idx] !== targetChar || this.colorData[idx] !== targetColor) continue;

            visited.add(idx);
            this.screenData[idx] = this.currentChar;
            this.colorData[idx] = this.currentColor;

            const col = idx % C64.SCREEN_COLS;
            const row = Math.floor(idx / C64.SCREEN_COLS);

            if (col > 0) stack.push(idx - 1);
            if (col < C64.SCREEN_COLS - 1) stack.push(idx + 1);
            if (row > 0) stack.push(idx - C64.SCREEN_COLS);
            if (row < C64.SCREEN_ROWS - 1) stack.push(idx + C64.SCREEN_COLS);
        }

        this.render();
    }

    _updatePreview(endCell) {
        if (!this.lineStart) return;

        this.previewOverlay = [];

        if (this.currentTool === 'line') {
            // Bresenham's line algorithm
            let x0 = this.lineStart.col, y0 = this.lineStart.row;
            let x1 = endCell.col, y1 = endCell.row;
            const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
            const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
            let err = dx - dy;

            while (true) {
                this.previewOverlay.push({ idx: y0 * C64.SCREEN_COLS + x0 });
                if (x0 === x1 && y0 === y1) break;
                const e2 = 2 * err;
                if (e2 > -dy) { err -= dy; x0 += sx; }
                if (e2 < dx) { err += dx; y0 += sy; }
            }
        } else if (this.currentTool === 'rect') {
            const x0 = Math.min(this.lineStart.col, endCell.col);
            const x1 = Math.max(this.lineStart.col, endCell.col);
            const y0 = Math.min(this.lineStart.row, endCell.row);
            const y1 = Math.max(this.lineStart.row, endCell.row);

            for (let x = x0; x <= x1; x++) {
                this.previewOverlay.push({ idx: y0 * C64.SCREEN_COLS + x });
                this.previewOverlay.push({ idx: y1 * C64.SCREEN_COLS + x });
            }
            for (let y = y0 + 1; y < y1; y++) {
                this.previewOverlay.push({ idx: y * C64.SCREEN_COLS + x0 });
                this.previewOverlay.push({ idx: y * C64.SCREEN_COLS + x1 });
            }
        }

        this.render();
    }

    _onTextKey(e) {
        if (this.textCursorPos < 0 || this.textCursorPos >= C64.SCREEN_SIZE) return;

        if (e.key === 'Escape') {
            this.textCursorPos = -1;
            this.render();
            return;
        }

        if (e.key === 'Enter') {
            // Move to next row
            const row = Math.floor(this.textCursorPos / C64.SCREEN_COLS);
            if (row < C64.SCREEN_ROWS - 1) {
                this.textCursorPos = (row + 1) * C64.SCREEN_COLS;
            }
            this.render();
            return;
        }

        if (e.key === 'Backspace') {
            if (this.textCursorPos > 0) {
                this._saveUndo();
                this.textCursorPos--;
                this.screenData[this.textCursorPos] = C64.SCREEN_CODE_SPACE;
                this.colorData[this.textCursorPos] = this.currentColor;
                this.render();
            }
            e.preventDefault();
            return;
        }

        if (e.key.length === 1) {
            this._saveUndo();
            const sc = C64.asciiToScreenCode(e.key.charCodeAt(0));
            this.screenData[this.textCursorPos] = sc;
            this.colorData[this.textCursorPos] = this.currentColor;
            this.textCursorPos++;
            if (this.textCursorPos >= C64.SCREEN_SIZE) this.textCursorPos = C64.SCREEN_SIZE - 1;
            this.render();
            e.preventDefault();
        }
    }

    // ── Undo / Redo ─────────────────────────────────────────────────────

    _saveUndo() {
        this.undoStack.push({
            screen: new Uint8Array(this.screenData),
            color: new Uint8Array(this.colorData),
            border: this.borderColor,
            bg: this.bgColor,
        });
        if (this.undoStack.length > this.maxUndo) this.undoStack.shift();
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) return;
        this.redoStack.push({
            screen: new Uint8Array(this.screenData),
            color: new Uint8Array(this.colorData),
            border: this.borderColor,
            bg: this.bgColor,
        });
        const state = this.undoStack.pop();
        this.screenData.set(state.screen);
        this.colorData.set(state.color);
        this.borderColor = state.border;
        this.bgColor = state.bg;
        this.render();
    }

    redo() {
        if (this.redoStack.length === 0) return;
        this.undoStack.push({
            screen: new Uint8Array(this.screenData),
            color: new Uint8Array(this.colorData),
            border: this.borderColor,
            bg: this.bgColor,
        });
        const state = this.redoStack.pop();
        this.screenData.set(state.screen);
        this.colorData.set(state.color);
        this.borderColor = state.border;
        this.bgColor = state.bg;
        this.render();
    }

    // ── Screen Operations ───────────────────────────────────────────────

    /**
     * Clears the entire screen, filling all cells with spaces and default color.
     */
    clearScreen() {
        this.screenData.fill(C64.SCREEN_CODE_SPACE); // spaces
        this.colorData.fill(this.defaultTextColor);
        this.render();
    }

    /**
     * Fills the entire screen with a specific character and color.
     * @param {number} char - The screen code to fill with
     * @param {number} color - The color index to fill with (0-15)
     */
    fillScreen(char, color) {
        this._saveUndo();
        this.screenData.fill(char);
        this.colorData.fill(color !== undefined ? color : this.currentColor);
        this.render();
    }

    /**
     * Inverts all characters on the screen (toggles the reverse video bit).
     */
    invertScreen() {
        this._saveUndo();
        for (let i = 0; i < C64.SCREEN_SIZE; i++) {
            this.screenData[i] ^= 0x80; // toggle reverse bit
        }
        this.render();
    }

    /**
     * Deletes a row from the screen, shifting all rows below it up.
     * @param {number} row - The row index to delete (0-24)
     */
    deleteRow(row) {
        if (row < 0 || row >= C64.SCREEN_ROWS) return;
        this._saveUndo();
        // Shift all rows below up by one
        for (let r = row; r < C64.SCREEN_ROWS - 1; r++) {
            const dst = r * C64.SCREEN_COLS;
            const src = (r + 1) * C64.SCREEN_COLS;
            for (let c = 0; c < C64.SCREEN_COLS; c++) {
                this.screenData[dst + c] = this.screenData[src + c];
                this.colorData[dst + c] = this.colorData[src + c];
            }
        }
        // Clear last row
        const lastRow = (C64.SCREEN_ROWS - 1) * C64.SCREEN_COLS;
        for (let c = 0; c < C64.SCREEN_COLS; c++) {
            this.screenData[lastRow + c] = C64.SCREEN_CODE_SPACE;
            this.colorData[lastRow + c] = this.defaultTextColor;
        }
        this.render();
    }

    /**
     * Inserts a new empty row at the specified position, shifting all rows below it down.
     * @param {number} row - The row index where to insert the new row (0-24)
     */
    insertRow(row) {
        if (row < 0 || row >= C64.SCREEN_ROWS) return;
        this._saveUndo();
        // Shift all rows from bottom up to make room
        for (let r = C64.SCREEN_ROWS - 1; r > row; r--) {
            const dst = r * C64.SCREEN_COLS;
            const src = (r - 1) * C64.SCREEN_COLS;
            for (let c = 0; c < C64.SCREEN_COLS; c++) {
                this.screenData[dst + c] = this.screenData[src + c];
                this.colorData[dst + c] = this.colorData[src + c];
            }
        }
        // Clear the inserted row
        const newRow = row * C64.SCREEN_COLS;
        for (let c = 0; c < C64.SCREEN_COLS; c++) {
            this.screenData[newRow + c] = C64.SCREEN_CODE_SPACE;
            this.colorData[newRow + c] = this.defaultTextColor;
        }
        this.render();
    }

    /**
     * Gets the auto-detected cursor row position (2 rows below last content).
     * Used to determine where the BASIC READY. prompt will appear after boot.
     * @returns {number} The row number (0-24) where the cursor should appear
     */
    getCursorRow() {
        for (let row = C64.SCREEN_ROWS - 1; row >= 0; row--) {
            for (let col = 0; col < C64.SCREEN_COLS; col++) {
                if (this.screenData[row * C64.SCREEN_COLS + col] !== C64.SCREEN_CODE_SPACE) {
                    return Math.min(row + 1, C64.SCREEN_ROWS - 1);
                }
            }
        }
        return 0;
    }

    /**
     * Loads screen data from arrays into the editor.
     * @param {Uint8Array|Array} screenCodes - Array of screen codes (0-255)
     * @param {Uint8Array|Array} colors - Array of color indices (0-15)
     * @param {number} [border] - Border color index (0-15)
     * @param {number} [bg] - Background color index (0-15)
     */
    loadScreen(screenCodes, colors, border, bg) {
        this._saveUndo();
        if (screenCodes) this.screenData.set(screenCodes.slice(0, C64.SCREEN_SIZE));
        if (colors) this.colorData.set(colors.slice(0, C64.SCREEN_SIZE));
        if (border !== undefined) this.borderColor = border;
        if (bg !== undefined) this.bgColor = bg;
        this.render();
    }

    /**
     * Loads a custom character ROM (chargen) into the editor.
     * Supports full 4096-byte ROMs or partial 2048-byte character sets.
     * @param {Uint8Array|Array} data - The chargen ROM data (2048 or 4096 bytes)
     */
    loadChargen(data) {
        if (data.length >= C64.CHARSET_SIZE) {
            this.chargenROM = new Uint8Array(data.slice(0, C64.CHARSET_SIZE));
        } else if (data.length >= C64.CHARSET_HALF) {
            // Partial - just one set
            this.chargenROM = new Uint8Array(C64.CHARSET_SIZE);
            this.chargenROM.set(data.slice(0, C64.CHARSET_HALF));
            // Generate reverse for second half
            for (let i = 0; i < C64.CHARSET_HALF; i++) this.chargenROM[C64.CHARSET_HALF + i] = data[i] ^ 0xFF;
        }
        this.render();
    }

    /**
     * Gets the current screen state for export or saving.
     * @returns {Object} Object containing screen data, colors, and color settings
     * @property {Array} screen - Array of screen codes (1000 elements, 0-255)
     * @property {Array} color - Array of color indices (1000 elements, 0-15)
     * @property {number} borderColor - Border color index (0-15)
     * @property {number} bgColor - Background color index (0-15)
     */
    getScreenState() {
        return {
            screen: Array.from(this.screenData),
            color: Array.from(this.colorData),
            borderColor: this.borderColor,
            bgColor: this.bgColor,
        };
    }

    // ── Canvas Rendering ────────────────────────────────────────────────

    /**
     * Renders the current screen state to the canvas.
     * Draws the 40x25 grid with characters and per-cell colors.
     */
    render() {
        // Final safety check for colors
        const isValidColor = (value) =>
            Number.isInteger(value) && value >= 0 && value < C64.COLORS.length;
        if (!isValidColor(this.borderColor)) this.borderColor = 6;
        if (!isValidColor(this.bgColor)) this.bgColor = 0;
        if (!isValidColor(this.currentColor)) this.currentColor = 14;
        
        const ctx = this.ctx;
        const s = this.scale;
        const bw = C64.CHAR_WIDTH * s;
        const bh = C64.CHAR_HEIGHT * s;
        const bs = this.borderSize;

        // Draw border
        const borderColorSafe = Math.min((this.borderColor || 0) & 0x0F, C64.COLORS.length - 1);
        ctx.fillStyle = C64.COLORS[borderColorSafe].hex;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        const bgColorSafe = Math.min((this.bgColor || 0) & 0x0F, C64.COLORS.length - 1);
        ctx.fillStyle = C64.COLORS[bgColorSafe].hex;
        ctx.fillRect(bs, bs, C64.SCREEN_COLS * bw, C64.SCREEN_ROWS * bh);

        // Draw each character cell
        const charsetOffset = this.charSet * C64.CHARSET_HALF;
        const bgCol = C64.COLORS[Math.min(this.bgColor || 0, C64.COLORS.length - 1)];

        for (let row = 0; row < C64.SCREEN_ROWS; row++) {
            for (let col = 0; col < C64.SCREEN_COLS; col++) {
                const idx = row * C64.SCREEN_COLS + col;
                const sc = this.screenData[idx];
                const fgColorIdx = this.colorData[idx] || 0;
                const fgCol = C64.COLORS[Math.min(fgColorIdx & 0x0F, C64.COLORS.length - 1)];

                this._drawChar(
                    bs + col * bw, bs + row * bh,
                    sc, fgCol, bgCol, charsetOffset
                );
            }
        }

        // Draw preview overlay (line/rect tool)
        if (this.previewOverlay && this.previewOverlay.length > 0) {
            const cursorColorSafe = Math.min((this.currentColor || 0) & 0x0F, C64.COLORS.length - 1);
            const fgCol = C64.COLORS[cursorColorSafe];
            for (const p of this.previewOverlay) {
                const row = Math.floor(p.idx / C64.SCREEN_COLS);
                const col = p.idx % C64.SCREEN_COLS;
                this._drawChar(
                    bs + col * bw, bs + row * bh,
                    this.currentChar, fgCol, bgCol, charsetOffset
                );
            }
        }

        // Draw text cursor
        if (this.textCursorPos >= 0 && this.currentTool === 'text') {
            const row = Math.floor(this.textCursorPos / C64.SCREEN_COLS);
            const col = this.textCursorPos % C64.SCREEN_COLS;
            const x = bs + col * bw;
            const y = bs + row * bh;
            // Draw full block cursor
            const cursorColorSafe = Math.min((this.currentColor || 0) & 0x0F, C64.COLORS.length - 1);
            ctx.fillStyle = C64.COLORS[cursorColorSafe].hex;
            ctx.fillRect(x, y, bw, bh);
        }

        // Draw grid overlay
        if (this.showGrid) {
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            for (let col = 0; col <= C64.SCREEN_COLS; col++) {
                const x = bs + col * bw + 0.5;
                ctx.beginPath();
                ctx.moveTo(x, bs);
                ctx.lineTo(x, bs + C64.SCREEN_ROWS * bh);
                ctx.stroke();
            }
            for (let row = 0; row <= C64.SCREEN_ROWS; row++) {
                const y = bs + row * bh + 0.5;
                ctx.beginPath();
                ctx.moveTo(bs, y);
                ctx.lineTo(bs + C64.SCREEN_COLS * bw, y);
                ctx.stroke();
            }
        }

        if (this.onScreenChange) this.onScreenChange();
    }

    _drawChar(x, y, screenCode, fgColor, bgColor, charsetOffset) {
        const ctx = this.ctx;
        const s = this.scale;

        // Handle reverse video (screen codes 128-255)
        let charIdx = screenCode & 0x7F;
        const isReversed = (screenCode & 0x80) !== 0;

        // Look up character bitmap in chargen ROM
        const romOffset = charsetOffset + charIdx * 8;

        for (let py = 0; py < 8; py++) {
            let rowBits = this.chargenROM[romOffset + py] || 0;
            if (isReversed) rowBits ^= 0xFF;

            for (let px = 0; px < 8; px++) {
                const bit = (rowBits >> (7 - px)) & 1;
                ctx.fillStyle = bit ? fgColor.hex : bgColor.hex;
                ctx.fillRect(x + px * s, y + py * s, s, s);
            }
        }
    }

    // ── Utility: render a single character to a small canvas ────────────
    renderCharToCanvas(targetCanvas, screenCode, fgColorIdx, bgColorIdx, scale) {
        const ctx = targetCanvas.getContext('2d');
        const s = scale || 2;
        targetCanvas.width = 8 * s;
        targetCanvas.height = 8 * s;
        ctx.imageSmoothingEnabled = false;

        const charsetOffset = this.charSet * C64.CHARSET_HALF;
        const charIdx = screenCode & 0x7F;
        const isReversed = (screenCode & 0x80) !== 0;
        const romOffset = charsetOffset + charIdx * 8;
        
        // Safe color index handling
        const fgIdx = Math.min(((fgColorIdx !== undefined ? fgColorIdx : this.currentColor) || 0) & 0x0F, C64.COLORS.length - 1);
        const bgIdx = Math.min(((bgColorIdx !== undefined ? bgColorIdx : this.bgColor) || 0) & 0x0F, C64.COLORS.length - 1);
        const fgCol = C64.COLORS[fgIdx];
        const bgCol = C64.COLORS[bgIdx];

        for (let py = 0; py < 8; py++) {
            let rowBits = this.chargenROM[romOffset + py] || 0;
            if (isReversed) rowBits ^= 0xFF;
            for (let px = 0; px < 8; px++) {
                const bit = (rowBits >> (7 - px)) & 1;
                ctx.fillStyle = bit ? fgCol.hex : bgCol.hex;
                ctx.fillRect(px * s, py * s, s, s);
            }
        }
    }
}

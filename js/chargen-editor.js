// C64 Boot Screen Editor - Character ROM (Chargen) Editor
// Visual 8x8 pixel editor for individual characters

class ChargenEditor {
    constructor(canvasId, previewCanvasId) {
        this.canvas = document.getElementById(canvasId);
        this.previewCanvas = previewCanvasId ? document.getElementById(previewCanvasId) : null;
        this.ctx = this.canvas.getContext('2d');

        this.pixelScale = 24; // each pixel = 24x24 screen pixels
        this.chargenData = null; // reference to screen editor's chargen ROM
        this.selectedChar = 0;
        this.charSet = 0; // 0 or 1
        this.isDrawing = false;
        this.drawMode = 1; // 1 = set pixel, 0 = clear pixel

        this.onCharModified = null; // callback when character is edited

        this._setupCanvas();
        this._setupEvents();
    }

    _setupCanvas() {
        this.canvas.width = 8 * this.pixelScale;
        this.canvas.height = 8 * this.pixelScale;
        this.canvas.style.cursor = 'crosshair';
        this.ctx.imageSmoothingEnabled = false;
    }

    _setupEvents() {
        this.canvas.addEventListener('mousedown', (e) => this._onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.isDrawing = false);
        this.canvas.addEventListener('mouseleave', () => this.isDrawing = false);
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    setChargenData(data) {
        this.chargenData = data;
        this.render();
    }

    selectChar(screenCode) {
        this.selectedChar = screenCode & 0x7F; // strip reverse bit
        this.render();
    }

    _getPixelFromMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / (rect.width / 8));
        const y = Math.floor((e.clientY - rect.top) / (rect.height / 8));
        if (x >= 0 && x < 8 && y >= 0 && y < 8) return { x, y };
        return null;
    }

    _onMouseDown(e) {
        const pixel = this._getPixelFromMouse(e);
        if (!pixel || !this.chargenData) return;

        this.isDrawing = true;
        // Left click = set, right click = clear
        this.drawMode = (e.button === 2) ? 0 : 1;
        this._togglePixel(pixel);
    }

    _onMouseMove(e) {
        if (!this.isDrawing) return;
        const pixel = this._getPixelFromMouse(e);
        if (pixel) this._togglePixel(pixel);
    }

    _togglePixel(pixel) {
        const offset = this.charSet * 2048 + this.selectedChar * 8 + pixel.y;
        const bit = 7 - pixel.x;

        if (this.drawMode) {
            this.chargenData[offset] |= (1 << bit);
        } else {
            this.chargenData[offset] &= ~(1 << bit);
        }

        // Also update reverse version
        const reverseOffset = offset + 1024;
        this.chargenData[reverseOffset] = this.chargenData[offset] ^ 0xFF;

        this.render();
        if (this.onCharModified) this.onCharModified(this.selectedChar);
    }

    // ── Operations on current character ─────────────────────────────────

    shiftLeft() { this._transformChar((row) => ((row << 1) | (row >> 7)) & 0xFF); }
    shiftRight() { this._transformChar((row) => ((row >> 1) | (row << 7)) & 0xFF); }

    shiftUp() {
        if (!this.chargenData) return;
        const offset = this.charSet * 2048 + this.selectedChar * 8;
        const first = this.chargenData[offset];
        for (let i = 0; i < 7; i++) {
            this.chargenData[offset + i] = this.chargenData[offset + i + 1];
        }
        this.chargenData[offset + 7] = first;
        this._updateReverse();
        this.render();
        if (this.onCharModified) this.onCharModified(this.selectedChar);
    }

    shiftDown() {
        if (!this.chargenData) return;
        const offset = this.charSet * 2048 + this.selectedChar * 8;
        const last = this.chargenData[offset + 7];
        for (let i = 7; i > 0; i--) {
            this.chargenData[offset + i] = this.chargenData[offset + i - 1];
        }
        this.chargenData[offset] = last;
        this._updateReverse();
        this.render();
        if (this.onCharModified) this.onCharModified(this.selectedChar);
    }

    invertChar() { this._transformChar((row) => row ^ 0xFF); }

    mirrorHorizontal() {
        this._transformChar((row) => {
            let result = 0;
            for (let i = 0; i < 8; i++) {
                if (row & (1 << i)) result |= (1 << (7 - i));
            }
            return result;
        });
    }

    mirrorVertical() {
        if (!this.chargenData) return;
        const offset = this.charSet * 2048 + this.selectedChar * 8;
        for (let i = 0; i < 4; i++) {
            const tmp = this.chargenData[offset + i];
            this.chargenData[offset + i] = this.chargenData[offset + 7 - i];
            this.chargenData[offset + 7 - i] = tmp;
        }
        this._updateReverse();
        this.render();
        if (this.onCharModified) this.onCharModified(this.selectedChar);
    }

    clearChar() {
        if (!this.chargenData) return;
        const offset = this.charSet * 2048 + this.selectedChar * 8;
        for (let i = 0; i < 8; i++) this.chargenData[offset + i] = 0;
        this._updateReverse();
        this.render();
        if (this.onCharModified) this.onCharModified(this.selectedChar);
    }

    _transformChar(fn) {
        if (!this.chargenData) return;
        const offset = this.charSet * 2048 + this.selectedChar * 8;
        for (let i = 0; i < 8; i++) {
            this.chargenData[offset + i] = fn(this.chargenData[offset + i]);
        }
        this._updateReverse();
        this.render();
        if (this.onCharModified) this.onCharModified(this.selectedChar);
    }

    _updateReverse() {
        const offset = this.charSet * 2048 + this.selectedChar * 8;
        const reverseOffset = offset + 1024;
        for (let i = 0; i < 8; i++) {
            this.chargenData[reverseOffset + i] = this.chargenData[offset + i] ^ 0xFF;
        }
    }

    // ── Rendering ───────────────────────────────────────────────────────

    render() {
        if (!this.chargenData) return;

        const ctx = this.ctx;
        const s = this.pixelScale;
        const offset = this.charSet * 2048 + this.selectedChar * 8;

        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw pixels
        for (let py = 0; py < 8; py++) {
            const row = this.chargenData[offset + py];
            for (let px = 0; px < 8; px++) {
                const bit = (row >> (7 - px)) & 1;
                ctx.fillStyle = bit ? '#0088FF' : '#16213e';
                ctx.fillRect(px * s + 1, py * s + 1, s - 2, s - 2);
            }
        }

        // Grid lines
        ctx.strokeStyle = '#0f3460';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 8; i++) {
            ctx.beginPath();
            ctx.moveTo(i * s, 0);
            ctx.lineTo(i * s, 8 * s);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * s);
            ctx.lineTo(8 * s, i * s);
            ctx.stroke();
        }

        // Update preview
        this._renderPreview();
    }

    _renderPreview() {
        if (!this.previewCanvas || !this.chargenData) return;
        const ctx = this.previewCanvas.getContext('2d');
        const s = 4;
        this.previewCanvas.width = 8 * s;
        this.previewCanvas.height = 8 * s;
        ctx.imageSmoothingEnabled = false;

        const offset = this.charSet * 2048 + this.selectedChar * 8;

        for (let py = 0; py < 8; py++) {
            const row = this.chargenData[offset + py];
            for (let px = 0; px < 8; px++) {
                const bit = (row >> (7 - px)) & 1;
                ctx.fillStyle = bit ? '#0088FF' : '#0000AA';
                ctx.fillRect(px * s, py * s, s, s);
            }
        }
    }
}

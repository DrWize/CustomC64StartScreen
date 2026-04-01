// C64 Boot Screen Editor - Main Application Controller
// Wires together all modules and manages UI interactions

class App {
    constructor() {
        this.editor = new ScreenEditor('c64-canvas');
        this.patcher = new RomPatcher();
        this.charEditor = new ChargenEditor('chargen-canvas', 'chargen-preview');

        this.charEditor.setChargenData(this.editor.chargenROM);

        this._setupToolbar();
        this._setupColorPickers();
        this._setupCharPicker();
        this._setupTemplates();
        this._setupFileIO();
        this._setupChargenControls();
        this._setupFontLibrary();
        this._setupStatusBar();
        this._setupKeyboard();
        this._setupTabs();

        // Load default template
        this._loadTemplate(Templates.getAll()[0]);
    }

    // ── Tabs ────────────────────────────────────────────────────────────

    _setupTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('tab-' + tab).classList.add('active');
            });
        });
    }

    // ── Toolbar ─────────────────────────────────────────────────────────

    _setupToolbar() {
        const tools = ['draw', 'erase', 'fill', 'text', 'colorpaint', 'line', 'rect'];
        tools.forEach(tool => {
            const btn = document.getElementById('tool-' + tool);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.editor.currentTool = tool;
                    this.editor.textCursorPos = -1;
                    this._updateToolButtons();
                    this.editor.render();
                });
            }
        });

        document.getElementById('btn-undo')?.addEventListener('click', () => this.editor.undo());
        document.getElementById('btn-redo')?.addEventListener('click', () => this.editor.redo());
        document.getElementById('btn-clear')?.addEventListener('click', () => {
            if (confirm('Clear the entire screen?')) {
                this.editor._saveUndo();
                this.editor.clearScreen();
            }
        });
        document.getElementById('btn-invert')?.addEventListener('click', () => this.editor.invertScreen());
        document.getElementById('btn-grid')?.addEventListener('click', () => {
            this.editor.showGrid = !this.editor.showGrid;
            document.getElementById('btn-grid').classList.toggle('active', this.editor.showGrid);
            this.editor.render();
        });

        // Row operations - uses last hovered row
        this._lastHoverRow = 0;
        document.getElementById('btn-del-row')?.addEventListener('click', () => {
            this.editor.deleteRow(this._lastHoverRow);
        });
        document.getElementById('btn-ins-row')?.addEventListener('click', () => {
            this.editor.insertRow(this._lastHoverRow);
        });

        // Charset toggle
        document.getElementById('btn-charset')?.addEventListener('click', () => {
            this.editor.charSet = this.editor.charSet ? 0 : 1;
            this.charEditor.charSet = this.editor.charSet;
            document.getElementById('btn-charset').textContent =
                this.editor.charSet ? 'CHARSET: LOWER' : 'CHARSET: UPPER';
            this.editor.render();
            this._buildCharPicker();
            this.charEditor.render();
        });

        this._updateToolButtons();
    }

    _updateToolButtons() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            const tool = btn.id.replace('tool-', '');
            btn.classList.toggle('active', tool === this.editor.currentTool);
        });
    }

    // ── Color Pickers ───────────────────────────────────────────────────

    _setupColorPickers() {
        this._buildColorPalette('border-colors', (colorIdx) => {
            this.editor._saveUndo();
            this.editor.borderColor = colorIdx;
            this.editor.render();
            this._updateColorIndicators();
        });

        this._buildColorPalette('bg-colors', (colorIdx) => {
            this.editor._saveUndo();
            this.editor.bgColor = colorIdx;
            this.editor.render();
            this._updateColorIndicators();
        });

        this._buildColorPalette('text-colors', (colorIdx) => {
            this.editor.currentColor = colorIdx;
            this.editor.defaultTextColor = colorIdx;
            this._updateColorIndicators();
        });

        document.getElementById('btn-apply-color')?.addEventListener('click', () => {
            this.editor._saveUndo();
            for (let i = 0; i < C64.SCREEN_SIZE; i++) {
                this.editor.colorData[i] = this.editor.currentColor;
            }
            this.editor.render();
        });

        this._updateColorIndicators();
    }

    _buildColorPalette(containerId, onClick) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        C64.COLORS.forEach((col, idx) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = col.hex;
            swatch.title = `${idx}: ${col.name}`;
            swatch.dataset.colorIdx = idx;
            if (idx === 0) swatch.style.border = '1px solid #555';
            swatch.addEventListener('click', () => onClick(idx));
            container.appendChild(swatch);
        });
    }

    _updateColorIndicators() {
        const borderInd = document.getElementById('border-current');
        const bgInd = document.getElementById('bg-current');
        const textInd = document.getElementById('text-current');

        if (borderInd) {
            borderInd.style.backgroundColor = C64.COLORS[this.editor.borderColor].hex;
            borderInd.title = C64.COLORS[this.editor.borderColor].name;
        }
        if (bgInd) {
            bgInd.style.backgroundColor = C64.COLORS[this.editor.bgColor].hex;
            bgInd.title = C64.COLORS[this.editor.bgColor].name;
        }
        if (textInd) {
            textInd.style.backgroundColor = C64.COLORS[this.editor.currentColor].hex;
            textInd.title = C64.COLORS[this.editor.currentColor].name;
        }

        // Update active indicators in palettes
        document.querySelectorAll('#border-colors .color-swatch').forEach(s => {
            s.classList.toggle('active', parseInt(s.dataset.colorIdx) === this.editor.borderColor);
        });
        document.querySelectorAll('#bg-colors .color-swatch').forEach(s => {
            s.classList.toggle('active', parseInt(s.dataset.colorIdx) === this.editor.bgColor);
        });
        document.querySelectorAll('#text-colors .color-swatch').forEach(s => {
            s.classList.toggle('active', parseInt(s.dataset.colorIdx) === this.editor.currentColor);
        });
    }

    // ── Character Picker ────────────────────────────────────────────────

    _setupCharPicker() {
        this._buildCharPicker();

        // Update char picker when chargen is modified
        this.charEditor.onCharModified = () => {
            this._buildCharPicker();
            this.editor.render();
        };
    }

    _buildCharPicker() {
        const container = document.getElementById('char-picker');
        if (!container) return;
        container.innerHTML = '';

        // Show all 256 screen codes (0-127 normal + 128-255 reverse)
        for (let sc = 0; sc < 256; sc++) {
            const cell = document.createElement('canvas');
            cell.className = 'char-cell';
            cell.width = 16;
            cell.height = 16;
            cell.title = `Screen code: ${sc} ($${sc.toString(16).padStart(2, '0').toUpperCase()})`;
            cell.dataset.screenCode = sc;

            this.editor.renderCharToCanvas(cell, sc, this.editor.currentColor, this.editor.bgColor, 2);

            cell.addEventListener('click', () => {
                this.editor.currentChar = sc;
                this.charEditor.selectChar(sc);
                this._highlightSelectedChar();
            });

            cell.addEventListener('dblclick', () => {
                // Switch to chargen editor tab and select this char
                this.editor.currentChar = sc;
                this.charEditor.selectChar(sc);
                document.querySelector('[data-tab="chargen"]')?.click();
            });

            container.appendChild(cell);
        }

        this._highlightSelectedChar();
    }

    _highlightSelectedChar() {
        document.querySelectorAll('.char-cell').forEach(cell => {
            cell.classList.toggle('active', parseInt(cell.dataset.screenCode) === this.editor.currentChar);
        });

        const info = document.getElementById('char-info');
        if (info) {
            const sc = this.editor.currentChar;
            info.textContent = `Char: ${sc} ($${sc.toString(16).padStart(2, '0').toUpperCase()})`;
        }
    }

    // ── Templates ───────────────────────────────────────────────────────

    _setupTemplates() {
        const container = document.getElementById('template-list');
        if (!container) return;

        const templates = Templates.getAll();
        templates.forEach(tmpl => {
            const btn = document.createElement('button');
            btn.className = 'template-btn';
            btn.innerHTML = `<strong>${tmpl.name}</strong><br><small>${tmpl.description}</small>`;
            btn.addEventListener('click', () => this._loadTemplate(tmpl));
            container.appendChild(btn);
        });

        // Flags dropdown
        const flagSection = document.getElementById('flag-list');
        if (!flagSection) return;

        const flags = Templates.getFlags();
        const select = document.createElement('select');
        select.className = 'flag-select';
        select.innerHTML = '<option value="">-- Select a flag --</option>';
        flags.forEach((flag, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = flag.name;
            select.appendChild(opt);
        });
        select.addEventListener('change', () => {
            if (select.value === '') return;
            this._loadTemplate(flags[parseInt(select.value)]);
        });
        flagSection.appendChild(select);

        // Preview grid: 3x3 colored blocks per flag
        const previewGrid = document.createElement('div');
        previewGrid.className = 'flag-preview-grid';
        flags.forEach((flag, idx) => {
            const item = document.createElement('div');
            item.className = 'flag-preview-item';
            item.title = flag.name;

            // Render 3x3 mini preview from the flag screen data
            const mini = document.createElement('canvas');
            mini.width = 24;
            mini.height = 18;
            const ctx = mini.getContext('2d');

            // Sample 3 rows x 3 cols from the flag area (rows 1-9, cols 4-35)
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    const sampleRow = 1 + Math.floor(r * 3) + 1;
                    const sampleCol = 4 + Math.floor(c * 10) + 3;
                    const sampleIdx = sampleRow * 40 + sampleCol;
                    const colorIdx = flag.color[sampleIdx];
                    ctx.fillStyle = C64.COLORS[colorIdx].hex;
                    ctx.fillRect(c * 8, r * 6, 8, 6);
                }
            }

            item.appendChild(mini);
            item.addEventListener('click', () => {
                select.value = idx;
                this._loadTemplate(flag);
            });
            previewGrid.appendChild(item);
        });
        flagSection.appendChild(previewGrid);
    }

    _loadTemplate(tmpl) {
        this.editor.loadScreen(tmpl.screen, tmpl.color, tmpl.borderColor, tmpl.bgColor);
        this._updateColorIndicators();
    }

    // ── File I/O ────────────────────────────────────────────────────────

    _setupFileIO() {
        // KERNAL ROM upload
        document.getElementById('rom-upload')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const info = await this.patcher.loadKernalROM(file);
                document.getElementById('rom-info').textContent =
                    `Loaded: ${info.fileName} (${info.size} bytes)`;
                document.getElementById('rom-loaded').style.display = 'block';

                // Show ROM's current boot screen settings
                document.getElementById('rom-line1').value = info.line1;
                document.getElementById('rom-line2').value = info.line2;
            } catch (err) {
                alert('Error loading ROM: ' + err.message);
            }
        });

        // Chargen ROM upload
        document.getElementById('chargen-upload')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const data = await this.patcher.loadChargenROM(file);
                this.editor.loadChargen(data);
                this.charEditor.setChargenData(this.editor.chargenROM);
                this._buildCharPicker();
                document.getElementById('chargen-info').textContent =
                    `Loaded: ${file.name} (${data.length} bytes)`;
            } catch (err) {
                alert('Error loading chargen ROM: ' + err.message);
            }
        });

        // Download buttons
        document.getElementById('btn-download-simple')?.addEventListener('click', () => {
            this._downloadSimple();
        });

        document.getElementById('btn-download-extended')?.addEventListener('click', () => {
            this._downloadExtended();
        });

        document.getElementById('btn-download-prg')?.addEventListener('click', () => {
            const state = this.editor.getScreenState();
            this.patcher.downloadPRG(state, 'bootscreen.prg');
        });

        document.getElementById('btn-download-chargen')?.addEventListener('click', () => {
            this.patcher.downloadChargen(this.editor.chargenROM, 'chargen-custom.bin');
        });

        // Export/Import JSON
        document.getElementById('btn-export-json')?.addEventListener('click', () => {
            const state = this.editor.getScreenState();
            const json = this.patcher.exportJSON(state);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'bootscreen.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        document.getElementById('btn-import-json')?.addEventListener('click', () => {
            document.getElementById('json-upload').click();
        });

        document.getElementById('json-upload')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const state = this.patcher.importJSON(ev.target.result);
                    this.editor.loadScreen(state.screen, state.color, state.borderColor, state.bgColor);
                    this._updateColorIndicators();
                } catch (err) {
                    alert('Error importing design: ' + err.message);
                }
            };
            reader.readAsText(file);
        });
    }

    _downloadSimple() {
        if (!this.patcher.romData) {
            alert('Please upload a KERNAL ROM file first.');
            return;
        }

        const line1 = document.getElementById('rom-line1')?.value || '';
        const line2 = document.getElementById('rom-line2')?.value || '';

        try {
            const patched = this.patcher.patchSimple(
                line1, line2,
                this.editor.borderColor,
                this.editor.bgColor,
                this.editor.currentColor
            );
            this.patcher.downloadROM(patched, 'kernal-simple.bin');
        } catch (err) {
            alert('Error patching ROM: ' + err.message);
        }
    }

    _downloadExtended() {
        if (!this.patcher.romData) {
            alert('Please upload a KERNAL ROM file first.');
            return;
        }

        const state = this.editor.getScreenState();

        try {
            const patched = this.patcher.patchExtended(state);
            this.patcher.downloadROM(patched, 'kernal-extended.bin');
        } catch (err) {
            alert('Error patching ROM: ' + err.message);
        }
    }

    // ── Font Library ────────────────────────────────────────────────────

    async _setupFontLibrary() {
        const container = document.getElementById('font-library');
        if (!container) return;

        // Built-in default is always available
        const fonts = [
            { name: 'Built-in (Default)', path: null },
        ];

        // Scan fonts/ directory for .bin files
        try {
            const response = await fetch('fonts/');
            if (response.ok) {
                const html = await response.text();
                // Parse directory listing - works with Python http.server, nginx, Apache
                // Look for links to .bin files
                const binFiles = [];
                // Match href="something.bin" patterns
                const hrefRegex = /href="([^"]*\.bin)"/gi;
                let match;
                while ((match = hrefRegex.exec(html)) !== null) {
                    binFiles.push(match[1]);
                }
                // Also try plain text listings (some servers)
                if (binFiles.length === 0) {
                    const lineRegex = /\b([\w\-\.]+\.bin)\b/gi;
                    while ((match = lineRegex.exec(html)) !== null) {
                        if (!binFiles.includes(match[1])) binFiles.push(match[1]);
                    }
                }

                // Sort alphabetically and add to font list
                binFiles.sort();
                for (const file of binFiles) {
                    const name = file.replace('.bin', '')
                        .replace(/_/g, ' ')
                        .replace(/-/g, ' ')
                        .replace(/\b\w/g, c => c.toUpperCase()); // Title Case
                    fonts.push({ name, path: 'fonts/' + file });
                }
            }
        } catch (e) {
            // Directory listing not available - that's OK
        }

        // If no fonts found from scanning, show a message
        if (fonts.length === 1) {
            const msg = document.createElement('div');
            msg.style.cssText = 'font-size:11px;color:var(--c64-text-dim);margin:4px 0';
            msg.textContent = 'No .bin files found in fonts/ folder. See README for download instructions.';
            container.appendChild(msg);
        }

        // Render font buttons
        for (const font of fonts) {
            const btn = document.createElement('button');
            btn.className = 'font-btn';
            btn.textContent = font.name;
            btn.dataset.path = font.path || '';
            btn.addEventListener('click', () => this._loadFont(font, btn));
            container.appendChild(btn);
        }

        // Mark the default as active
        const firstBtn = container.querySelector('.font-btn');
        if (firstBtn) firstBtn.classList.add('active');

        // Show count
        const count = fonts.length - 1; // exclude built-in
        if (count > 0) {
            const info = document.createElement('div');
            info.style.cssText = 'font-size:10px;color:var(--c64-text-dim);margin-top:4px';
            info.textContent = `${count} font${count !== 1 ? 's' : ''} found in fonts/`;
            container.appendChild(info);
        }
    }

    async _loadFont(font, btn) {
        // Update active state
        document.querySelectorAll('.font-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (!font.path) {
            // Reset to built-in chargen
            this.editor.chargenROM = C64.buildChargenROM();
            this.charEditor.setChargenData(this.editor.chargenROM);
            this._buildCharPicker();
            this.editor.render();
            document.getElementById('chargen-info').textContent = 'Using built-in character set';
            return;
        }

        try {
            const response = await fetch(font.path);
            if (!response.ok) throw new Error(`Failed to fetch ${font.path}`);
            const buffer = await response.arrayBuffer();
            const data = new Uint8Array(buffer);

            if (data.length !== 4096) {
                throw new Error(`Invalid chargen size: ${data.length} bytes (expected 4096)`);
            }

            this.editor.loadChargen(data);
            this.charEditor.setChargenData(this.editor.chargenROM);
            this._buildCharPicker();
            this.editor.render();
            document.getElementById('chargen-info').textContent = `Font: ${font.name}`;
        } catch (err) {
            alert('Error loading font: ' + err.message);
        }
    }

    // ── Chargen Editor Controls ─────────────────────────────────────────

    _setupChargenControls() {
        const actions = {
            'chargen-shift-up': () => this.charEditor.shiftUp(),
            'chargen-shift-down': () => this.charEditor.shiftDown(),
            'chargen-shift-left': () => this.charEditor.shiftLeft(),
            'chargen-shift-right': () => this.charEditor.shiftRight(),
            'chargen-mirror-h': () => this.charEditor.mirrorHorizontal(),
            'chargen-mirror-v': () => this.charEditor.mirrorVertical(),
            'chargen-invert': () => this.charEditor.invertChar(),
            'chargen-clear': () => this.charEditor.clearChar(),
        };

        for (const [id, fn] of Object.entries(actions)) {
            document.getElementById(id)?.addEventListener('click', () => {
                fn();
                this._buildCharPicker();
                this.editor.render();
            });
        }
    }

    // ── Status Bar ──────────────────────────────────────────────────────

    _setupStatusBar() {
        this.editor.onCellHover = (col, row, sc, colorIdx) => {
            this._lastHoverRow = row;
            const status = document.getElementById('status-bar');
            if (status) {
                status.textContent = `Col: ${col}  Row: ${row}  Char: ${sc} ($${sc.toString(16).padStart(2, '0').toUpperCase()})  Color: ${colorIdx} (${C64.COLORS[colorIdx].name})`;
            }
        };

        this.editor.onScreenChange = () => {
            this._updateColorIndicators();
            this._updateCursorInfo();
        };

        // Initial cursor info
        this._updateCursorInfo();
    }

    _updateCursorInfo() {
        const cursorRow = this.editor.getCursorRow();
        const info = document.getElementById('cursor-info');
        if (info) info.textContent = `READY. will appear at row ${cursorRow} (auto-detected)`;
        const pos = document.getElementById('cursor-pos');
        if (pos) pos.textContent = `READY. at row ${cursorRow}`;
    }

    // ── Keyboard Shortcuts ──────────────────────────────────────────────

    _setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            // Don't capture if text input is focused
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            // Don't capture if in text tool mode
            if (this.editor.currentTool === 'text' && this.editor.textCursorPos >= 0) return;

            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) this.editor.redo();
                        else this.editor.undo();
                        break;
                    case 'y':
                        e.preventDefault();
                        this.editor.redo();
                        break;
                }
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'd': this.editor.currentTool = 'draw'; break;
                case 'e': this.editor.currentTool = 'erase'; break;
                case 'f': this.editor.currentTool = 'fill'; break;
                case 't': this.editor.currentTool = 'text'; break;
                case 'c': this.editor.currentTool = 'colorpaint'; break;
                case 'l': this.editor.currentTool = 'line'; break;
                case 'r': this.editor.currentTool = 'rect'; break;
                case 'g':
                    this.editor.showGrid = !this.editor.showGrid;
                    document.getElementById('btn-grid')?.classList.toggle('active', this.editor.showGrid);
                    this.editor.render();
                    break;
                default: return;
            }
            this.editor.textCursorPos = -1;
            this._updateToolButtons();
            this.editor.render();
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

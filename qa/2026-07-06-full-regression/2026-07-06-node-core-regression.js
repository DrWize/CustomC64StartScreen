const fs = require('fs');
const vm = require('vm');

const sources = [
    'js/c64-data.js',
    'js/screen-editor.js',
    'js/rom-patcher.js',
].map((file) => fs.readFileSync(file, 'utf8')).join('\n');

vm.runInThisContext(`${sources}
globalThis.TestC64 = C64;
globalThis.TestScreenEditor = ScreenEditor;
globalThis.TestRomPatcher = RomPatcher;`);

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

// Black is a valid C64 color and must survive rendering.
const editor = Object.create(TestScreenEditor.prototype);
Object.assign(editor, {
    borderColor: 0,
    bgColor: 0,
    currentColor: 0,
    ctx: {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        fillRect() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        stroke() {},
    },
    canvas: { width: 1024, height: 768 },
    scale: 1,
    borderSize: 0,
    charSet: 0,
    chargenROM: TestC64.buildChargenROM(),
    screenData: new Uint8Array(TestC64.SCREEN_SIZE).fill(TestC64.SCREEN_CODE_SPACE),
    colorData: new Uint8Array(TestC64.SCREEN_SIZE),
    previewOverlay: null,
    textCursorPos: -1,
    currentTool: 'draw',
    showGrid: false,
    onScreenChange: null,
});
editor.render();
assert(editor.borderColor === 0, 'Black border was replaced');
assert(editor.bgColor === 0, 'Black background was replaced');
assert(editor.currentColor === 0, 'Black drawing color was replaced');

// Exported PRGs must contain an exact, importable copy of their screen state.
const patcher = new TestRomPatcher();
const state = {
    screen: Array.from({ length: TestC64.SCREEN_SIZE }, (_, i) => i & 0xFF),
    color: Array.from({ length: TestC64.SCREEN_SIZE }, (_, i) => i & 0x0F),
    borderColor: 0,
    bgColor: 6,
};
const prg = patcher._exportPRG(state);
const imported = patcher._readPrgTrailer(prg);
assert(imported !== null, 'Exported PRG trailer was not detected');
assert(imported.borderColor === state.borderColor, 'PRG border color did not round-trip');
assert(imported.bgColor === state.bgColor, 'PRG background color did not round-trip');
assert(imported.screen.every((value, i) => value === state.screen[i]), 'PRG screen did not round-trip');
assert(imported.color.every((value, i) => value === state.color[i]), 'PRG colors did not round-trip');

// Reject arbitrary 8 KB data while accepting the structural fields we patch.
const validRom = new Uint8Array(TestC64.ROM.SIZE);
for (const offset of [0x1FFA, 0x1FFC, 0x1FFE]) {
    validRom[offset] = 0x00;
    validRom[offset + 1] = 0xE0;
}
const line1End = TestC64.ROM.LINE1_OFFSET + TestC64.ROM.LINE1_LENGTH;
validRom[line1End - 2] = 0x0D;
validRom[line1End - 1] = 0x0D;
patcher._validateKernalROM(validRom);

let rejected = false;
try {
    patcher._validateKernalROM(new Uint8Array(TestC64.ROM.SIZE));
} catch {
    rejected = true;
}
assert(rejected, 'Arbitrary 8 KB data was accepted as a KERNAL');

console.log('QA regression tests passed.');

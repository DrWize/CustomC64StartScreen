# C64 Boot Screen Editor

A browser-based tool for designing custom Commodore 64 startup screens. Draw PETSCII art, pick from templates and country flags, edit character ROMs, and patch your KERNAL ROM with the result.

## Setup

1. Clone this repo
2. **Download the font files** - see [Font Files](#font-files-required) below. The font library will not work without them.
3. Serve with any HTTP server: `python -m http.server 8064`
4. Open http://localhost:8064

## Features

### Screen Editor
- 40x25 character grid rendered on HTML5 Canvas using C64 chargen bitmap data
- **Drawing tools**: Draw, Erase, Fill, Text, Color Paint, Line, Rectangle
- **Row operations**: Delete Row (shifts rows up), Insert Row (shifts rows down)
- **Per-cell color**: each character can have its own foreground color from the 16-color C64 palette
- **Global colors**: border and background color pickers
- **"Apply color to all"** button to recolor all existing characters at once
- Right-click to pick character + color from screen
- Undo/Redo with full state history
- Grid overlay toggle
- Uppercase/graphics and lowercase/uppercase character set toggle

### Templates
- **Boot screens**: Classic C64, Dark Mode, Hacker Green, C= Logo Modern, Rainbow, Retro Terminal, Blank, Just Ready, Underline, Color Bars
- **C64 Ultimate editions**: Ultimate, Ultimate Dark, Ultimate Gold, Ultimate Starlight
- **Country flags** (13): Sweden, Norway, Finland, Denmark, Germany, France, Italy, Netherlands, Ukraine, USA, United Kingdom, Japan, Brazil - with 3x3 color preview thumbnails and dropdown selector

### Character ROM / Font Library
- **Auto-scans** the `fonts/` directory on startup — drop any `.bin` file in and refresh
- Click any font to instantly switch the screen and character picker
- Upload your own 4KB chargen ROM via the Chargen tab
- **8x8 pixel editor** for individual characters with shift, mirror, invert, clear operations
- Download modified chargen ROM

### ROM Patching
- **Simple mode**: change startup text (Line 1 + Line 2) and colors in the KERNAL ROM
- **Extended mode**: inject a full PETSCII boot screen into the KERNAL ROM using RLE-compressed 6502 machine code
  - Overwrites RS-232 routines (safe for most users who don't use the serial port)
  - Hooks into the KERNAL startup at `$E39A`, replacing the banner print routine
  - Auto-detects cursor position: BASIC's "READY." prompt lands 2 rows below your design
  - Sets text color for READY. to match your design's dominant color
  - Jumps to BASIC warm start (`$A644`) for normal input loop
- **Status bar** shows where the cursor/READY. will appear after boot

### Export
- **Patched KERNAL ROM** (.bin) - Simple or Extended mode
- **.PRG file** - C64 executable for testing in VICE emulator (press any key to exit)
- **JSON** - export/import screen designs for sharing
- **Chargen ROM** (.bin) - download modified character set

### Keyboard Shortcuts
| Key | Tool |
|-----|------|
| D | Draw |
| E | Erase |
| F | Fill |
| T | Text mode |
| C | Color paint |
| L | Line |
| R | Rectangle |
| G | Toggle grid |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Right-click | Pick char + color from screen |

## Usage

Serve the project with any HTTP server and open in a browser:

```bash
python -m http.server 8064
```

Then open http://localhost:8064

No build step required - plain HTML/CSS/JS.

## Project Structure

```
C64Boot/
  index.html                 - Main app
  css/styles.css             - C64-themed dark UI
  js/
    c64-data.js              - Chargen ROM data, color palette, PETSCII mappings
    screen-editor.js         - Canvas-based 40x25 PETSCII editor
    rom-patcher.js           - KERNAL ROM patching + .PRG export + RLE compression
    chargen-editor.js        - 8x8 pixel character editor
    templates.js             - Boot screen templates + country flags
    app.js                   - Main app controller
  fonts/                     - Chargen ROM .bin files (not in repo, see below)
  kernal/                    - Your KERNAL ROM files (not in repo)
```

## Font Files (REQUIRED)

The font library needs chargen ROM files (.bin, 4096 bytes each) placed in the `fonts/` directory. These are **not included in the repository** - you must download them yourself.

### Source: patrickmollohan/c64-fonts

Download all font ROMs from [patrickmollohan/c64-fonts](https://github.com/patrickmollohan/c64-fonts) and place them in the `fonts/` folder (flat, no subfolders):

```
fonts/
  c64.bin              - Default C64/128 character set
  c64_swedish.bin      - Swedish/Finnish variant
  c64_swedish2.bin     - Alternative Swedish variant
  aniron.bin           - Lord of the Rings inspired
  apple_ii.bin         - Apple II character set
  aurebesh.bin         - Star Wars Aurebesh script
  comic_sans.bin       - Comic Sans parody
  hachicro.bin         - Simplistic outline design
  kauno.bin            - Calligraphic font
  kirby_forgotten_land.bin - Kirby game font
  minecraft.bin        - Minecraft font
  pxlfont.bin          - PXLfont (see below)
  zx_spectrum.bin      - ZX Spectrum character set
```

Quick download (Linux/macOS):
```bash
mkdir -p fonts
for f in c64 c64_swedish c64_swedish2; do
  curl -sLO --output-dir fonts \
    "https://raw.githubusercontent.com/patrickmollohan/c64-fonts/master/original/${f}.bin"
done
for f in aniron apple_ii aurebesh comic_sans hachicro kauno kirby_forgotten_land minecraft zx_spectrum; do
  curl -sLO --output-dir fonts \
    "https://raw.githubusercontent.com/patrickmollohan/c64-fonts/master/custom/${f}.bin"
done
```

### Additional font: PXLfont

[PXLfont](https://csdb.dk/release/?id=187321) is a popular replacement character ROM for the C64 with improved readability. Download the .bin file from CSDB and place it as `fonts/pxlfont.bin`. It will appear in the font library as "PXLfont".

### Adding your own fonts

The font library **automatically scans** the `fonts/` directory on startup. Any `.bin` file (4096 bytes, C64 chargen ROM format) placed in the folder will appear in the list after a page refresh. No code changes needed — just drop the file in and reload.

You can also load any chargen ROM on the fly via the Chargen tab's "Upload Chargen ROM" button without placing it in the folder.

The editor works with the built-in character set even without any font files in the directory.

## KERNAL ROM

You need your own C64 KERNAL ROM file (8KB .bin/.rom) for the ROM patching features. The editor works without one for screen design and .PRG export.

### KERNAL ROM Offsets (for reference)

| Data | Offset | Length | Default |
|------|--------|--------|---------|
| Line 1 (banner) | 1141 | 37 bytes | `**** COMMODORE 64 BASIC V2 ****` |
| Line 2 (RAM info) | 1178 | 17 bytes | `64K RAM SYSTEM  ` |
| Border color | 3289 | 1 byte | `$0E` (light blue) |
| Background color | 3290 | 1 byte | `$06` (blue) |
| Text color | 1333 | 1 byte | `$0E` (light blue) |
| Banner print JSR | `$E39A` | 3 bytes | `JSR $E422` (hook point for extended mode) |

## Credits

- Font ROMs from [patrickmollohan/c64-fonts](https://github.com/patrickmollohan/c64-fonts)
- Inspired by [jcook793/c64-kernel-stamper](https://github.com/jcook793/c64-kernel-stamper) and [c64.pro](https://c64.pro/)
- C64 KERNAL mod guide from [breadbox64.com](http://www.breadbox64.com/blog/c64-kernal-mods/)
- C64 color reference from [c64-wiki.com](https://www.c64-wiki.com/wiki/Color)
- C64 TrueType fonts from [style64.org](http://style64.org/c64-truetype)

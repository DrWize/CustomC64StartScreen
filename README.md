# C64 Boot Screen Editor

A browser-based tool for designing custom Commodore 64 startup screens. Draw PETSCII art, pick from templates, edit character ROMs, and patch your KERNAL ROM with the result.

## Setup

1. Clone this repo
2. **Download the font files** - see [Font Files](#font-files-required) below. The font library will not work without them.
3. Open `index.html` in your browser — or use the included server script for the font library

The editor works directly from the filesystem (`file://`), but the **font library** needs a local server to scan the `fonts/` directory. 

### Option 1: Docker (Recommended)

The easiest and most reliable way to run the editor with full font library support. The Docker container includes Apache HTTPD with auto-indexing enabled, which allows the font library to scan the `fonts/` directory.

**Using the startup scripts (Recommended):**

```bash
# Linux/macOS
./start-server-docker.sh [port]

# Windows (PowerShell)
.\start-server-docker.ps1 [port]
```

The scripts automatically:
- Check if Docker is installed and running
- Build the Docker image with quiet mode
- Start the container with volume mounts for `fonts/` and `kernal/` directories
- Open the server on your specified port (default: 8064)

Example with custom port:
```bash
./start-server-docker.sh 8080
```

**Using docker-compose:**

```bash
# Start services (includes health checks)
docker-compose up

# Start in detached mode
docker-compose up -d

# Stop services
docker-compose down
```

The docker-compose configuration includes:
- Automatic volume mounting for `fonts/` and `kernal/` directories
- Health checks to ensure the server is running
- Automatic restart unless explicitly stopped

**Manual Docker commands:**
```bash
# Build the image
docker build -t c64boot-editor .

# Run the container with volume mounts
docker run --rm -it -p 8064:8064 \
    -v $(pwd)/fonts:/usr/local/apache2/htdocs/fonts:ro \
    -v $(pwd)/kernal:/usr/local/apache2/htdocs/kernal:ro \
    --name c64boot-editor \
    c64boot-editor
```

**Note**: Docker images now include automatic cache-busting — you no longer need `--no-cache` flag. Each build generates a unique layer that prevents stale caches.

### Option 2: Python HTTP Server

If you don't have Docker, you can use Python's built-in HTTP server:

```bash
# Linux/macOS
./start-server.sh

# Windows (PowerShell)
.\start-server.ps1
```

Then open http://localhost:8064 (pass a different port as an argument if needed).

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
- **Boot screens**: Classic C64, Dark Mode, Hacker Green, C= Logo Modern, Rainbow, Retro Terminal, Blank, Underline, Color Bars
- **C64 Ultimate editions**: Ultimate, Ultimate Dark, Ultimate Gold, Ultimate Starlight

### Character ROM / Font Library
- **Auto-scans** the `fonts/` directory on startup — drop any `.bin` file in and refresh
- Click any font to instantly switch the screen and character picker
- Upload your own 4KB chargen ROM via the Chargen tab
- **8x8 pixel editor** for individual characters with shift, mirror, invert, clear operations
- Download modified chargen ROM

### ROM Patching
- **Simple mode**: change startup text (Line 1 + Line 2) and colors in the KERNAL ROM
- **Extended mode**: inject a full PETSCII boot screen into the KERNAL ROM using RLE-compressed 6502 machine code
  - Overwrites RS-232 NMI/Tx/Rx routines at `$EEBB`-`$F0BC` (safe for users who don't use the serial port for RS-232)
  - Hooks into the KERNAL startup at `$E39A`, replacing the banner print routine
  - Auto-detects cursor position: BASIC's "READY." prompt lands 2 rows below your design
  - Sets text color for READY. to match your design's dominant color
  - Jumps to BASIC warm start (`$A644`) for normal input loop
- **Timestamped exports**: All downloads (KERNAL ROM, .PRG, .SEQ, .JSON, Chargen ROM) now include date/time in filenames for automatic uniqueness (e.g., `kernal-extended-2026-06-15T12-30-45.bin`, `bootscreen-2026-06-15T12-30-45.prg`)
- **Status bar** shows where the cursor/READY. will appear after boot

### Export & Output Formats

- **Patched KERNAL ROM** (.bin) — This is what you want for actually changing your boot screen. Upload your original KERNAL ROM in the ROM tab, design your screen, then download the patched `.bin`. In VICE: Settings > Machine > KERNAL and point to your patched file. On real hardware: burn to EPROM.
  - *Simple mode*: changes startup text + colors only
  - *Extended mode*: injects your full PETSCII screen design with custom 6502 code
- **.PRG file** — A standalone C64 program for quick preview/testing. Load it in VICE with `LOAD "BOOTSCREEN.PRG",8,1` then `RUN`. Displays your screen and waits for a keypress, then returns to BASIC. This does NOT modify your KERNAL — it's just for previewing. Filenames include timestamps for uniqueness.
- **SEQ file** (.seq) — Raw screen + color data (2000 bytes). Compact format for C64 tools. Does NOT store border/background colors.
- **JSON** — Export/import screen designs for sharing or later editing. Preserves complete state including border/background colors.
- **Chargen ROM** (.bin) — Download modified character set for use as a replacement chargen ROM. Filenames include timestamps.

### Import from External Tools

**Kaleidoscope Support**: The editor can import screen designs from Kaleidoscope. Get it from [CSDB](https://csdb.dk/release/?id=257846) or follow updates at [KSReloaded Facebook](https://www.facebook.com/ksreloaded/).

- **.PRG files**: Import Kaleidoscope-exported PRG files containing screen data (with or without color RAM). PRG files preserve border/background colors.
- **.SEQ files**: Import Kaleidoscope SEQ files (screen + color data). SEQ files do NOT store border/background colors and default to blue border/black background on import. Use the CHARSET toggle (UPPER/LOWER button) if characters display incorrectly.
- **How to use**: In the File tab, click "Import .PRG" or "Import .SEQ" and select your file. The design will load directly into the editor.
- **Note**: Imported designs use uppercase/graphics character set by default. Use the CHARSET button to toggle between uppercase and lowercase modes.

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

## Developer Functionality

### Cache Busting

The editor includes a **dynamic cache buster** to prevent browsers from loading stale CSS and JavaScript files during development. This feature is enabled by default.

**How it works:**
- All asset URLs (CSS, JS, favicon) automatically receive a `?v=<timestamp>` parameter
- The timestamp is generated dynamically using `Date.now()` (milliseconds since epoch)
- This ensures browsers always fetch the latest version of files

**Toggle cache busting:**
To disable cache busting, change the meta tag in `index.html`:
```html
<meta name="cache-buster" content="true">   <!-- Enabled (default) -->
<meta name="cache-buster" content="false">  <!-- Disabled -->
```

This is useful for development when you're frequently updating files, but can be disabled for production if desired.

## Usage

Just open `index.html` directly in your browser — no build step, no server required. Pure HTML/CSS/JS.

## Project Structure

```
C64Boot/
  index.html                 - Main app
  css/styles.css             - C64-themed dark UI
  js/
    c64-data.js              - Chargen ROM data, color palette, PETSCII mappings
    screen-editor.js         - Canvas-based 40x25 PETSCII editor
    rom-patcher.js           - KERNAL ROM patching + .PRG/.SEQ import/export + RLE compression
    chargen-editor.js        - 8x8 pixel character editor
    templates.js             - Boot screen templates
    app.js                   - Main app controller
  fonts/                     - Chargen ROM .bin files (not in repo, see Font Files below)
  kernal/                    - Your KERNAL ROM files (not in repo, see KERNAL ROM below)
  test-files/                - Test data for import functionality
  Dockerfile                 - Docker image with Apache HTTPD
  docker-compose.yml         - Docker Compose configuration
  start-server-docker.*    - Docker startup scripts
```

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        C64 Boot Screen Editor                      │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │  index.html     │    │   c64-data.js   │    │    templates   │ │
│  │   (Main UI)     │───▶│ (Constants/Data)│───▶│   (Presets)     │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│                          │                                          │
│                          ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                        App (app.js)                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │ │
│  │  │  Event      │  │  File I/O   │  │      UI Management             │ │ │
│  │  │  Handling   │  │  (Uploads)  │  │  (Toolbar, Colors, Status Bar) │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌───────────────────────────────────────────────────────────┐ │ │
│  │  │                   Module Coordination                        │ │ │
│  │  └───────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                          │                                          │
│          ┌───────────────┴───────────────┬──────────────────────┐ │
│          │                               │                              │ │
│          ▼                               ▼                              ▼ │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │ screen-editor.js│    │  rom-patcher.js  │    │ chargen-editor  │ │
│  │                 │    │                 │    │                 │ │
│  │ • 40x25 Canvas  │    │ • ROM Patching  │    │ • 8x8 Grid      │ │
│  │ • Drawing Tools │    │ • Simple/Extended│    │ • Pixel Editing │ │
│  │ • Undo/Redo     │    │ • PRG Export    │    │ • Character Set  │ │
│  │ • Row Ops       │    │ • RLE Compress  │    │   Switching     │ │
│  │ • Color Picker  │    │ • JSON Import   │    │                 │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Interaction → App → ScreenEditor/ChargenEditor/RomPatcher
                    ↓
              Canvas Rendering
                    ↓
              User Feedback (Status Bar, Previews)
```

### File Flow

```
Upload KERNAL ROM → RomPatcher.loadKernalROM() → Patching → Download Patched ROM
Upload Chargen ROM → ScreenEditor.loadChargen() → Editing → Download Modified Chargen
Import JSON → App → RomPatcher.importJSON() → ScreenEditor.loadScreen()
Export JSON → App → ScreenEditor.getScreenState() → JSON Download
```

## 📦 RLE Compression Format

The C64 Boot Screen Editor uses **Run-Length Encoding (RLE)** to compress screen and color data for injection into the KERNAL ROM. This compression is essential for fitting large designs into the limited space available in the RS-232 area ($EEBB-$F0BC, 514 bytes).

### Format Specification

The RLE compression format used is a **simple byte-oriented format**:

```
Compressed Data Structure:
┌──────────┬──────────┬──────────┬──────────┐
│  Count   │  Value   │  Count   │  Value   │ ...
├──────────┼──────────┼──────────┼──────────┤
│  1 byte  │  1 byte  │  1 byte  │  1 byte  │
└──────────┴──────────┴──────────┴──────────┘
                          │
                          ▼
                    [0x00] (End marker)
```

### Encoding Rules

1. **Run Length**: Each byte value is preceded by a count byte (1-255)
2. **Maximum Run**: 255 consecutive identical bytes (to fit in one byte)
3. **End Marker**: A single `0x00` byte marks the end of compressed data
4. **No Escaping**: The value `0x00` can appear in the data (it's just a count of 0)

### Example

**Original Data**: `0x20, 0x20, 0x20, 0x01, 0x01, 0x01, 0x01, 0x01`
- 3 × `0x20` (space)
- 5 × `0x01`

**Compressed**: `0x03, 0x20, 0x05, 0x01, 0x00`
- `0x03` = count of 3
- `0x20` = value (space)
- `0x05` = count of 5
- `0x01` = value
- `0x00` = end marker

### Usage in Extended Mode

In extended ROM patching mode:

1. Screen data (1000 bytes) is RLE-compressed
2. Color data (1000 bytes) is RLE-compressed separately
3. Both compressed streams are embedded in the 6502 machine code
4. The 6502 code includes a decompressor that:
   - Reads count-value pairs
   - Writes the value to screen/color RAM 'count' times
   - Stops when it encounters the `0x00` end marker

### Decompression Algorithm (6502 Assembly)

The decompressor in the injected code performs:

```
Loop:
  LDA (source),Y    ; Get count
  BEQ Done          ; If count=0, we're done
  STA temp_count    ; Store count
  INY               ; Move to value byte
  LDA (source),Y    ; Get value
  INY               ; Move to next pair
  
Decompress:
  STA target        ; Store value
  INC target        ; Move to next position
  DEC temp_count    ; Decrement count
  BNE Decompress    ; Loop until count=0
  
  JMP Loop          ; Process next pair
  
Done:
  RTS
```

### Compression Ratio

- **Worst Case**: 2:1 (alternating values like checkerboard)
- **Best Case**: ~50:1 (large areas of same character/color)
- **Typical**: 3:1 to 10:1 for most boot screen designs

### Size Limits

- **Available Space**: 514 bytes in RS-232 area
- **For Screen+Color**: ~250 bytes each after code overhead
- **Result**: Most designs fit; very complex designs may exceed limit

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

Quick download:
```bash
# Linux/macOS
./download-fonts.sh

# Windows (PowerShell)
.\download-fonts.ps1
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
| Banner print JSR | `$E39A` | 3 bytes | `JSR $E422` (hook point for extended mode, redirected to `$EEBB`) |
| RS-232 safe area | `$EEBB` | 514 bytes | RS-232 NMI/Tx/Rx routines (injection target for extended mode) |

## Credits

- Font ROMs from [patrickmollohan/c64-fonts](https://github.com/patrickmollohan/c64-fonts)
- Inspired by [jcook793/c64-kernel-stamper](https://github.com/jcook793/c64-kernel-stamper) and [c64.pro](https://c64.pro/)
- C64 KERNAL mod guide from [breadbox64.com](http://www.breadbox64.com/blog/c64-kernal-mods/)
- C64 color reference from [c64-wiki.com](https://www.c64-wiki.com/wiki/Color)
- C64 TrueType fonts from [style64.org](http://style64.org/c64-truetype)

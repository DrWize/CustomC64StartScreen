# C64 Boot Screen Editor — How To

This guide explains how to use the C64 Boot Screen Editor, including the main functions, editor tools, font library, and export options.

## Getting Started

1. Make sure the repository is cloned and your local folder contains `index.html`.
2. Download or place your C64 font files in the `fonts/` directory.
3. Open `index.html` in your browser, or run a local server if you want full font library support.

> The editor works directly from the filesystem (`file://`), but the font library requires a local server to scan `fonts/`.

## Recommended Launch Options

- Open `index.html` directly in your browser for basic usage.
- Use one of the server scripts if you want the font browser to work correctly:
  - Windows PowerShell: `./start-server-docker.ps1 [port]`
  - Python server: `./start-server.ps1`

## Editor Overview

![C64 Boot Screen Editor overview](docs/screenshots/editor-overview.png)

The main screen editor features a 40×25 character grid based on the Commodore 64 character display. Each cell stores a PETSCII character, foreground color, and default background color.

### Drawing tools

- **Draw**: place characters one cell at a time.
- **Erase**: clear selected cells.
- **Fill**: flood fill an area with the current character and color.
- **Text**: type text directly onto the screen.
- **Color Paint**: change the color of existing characters.
- **Line**: draw straight lines.
- **Rectangle**: draw boxes and filled rectangles.

### Grid and selection

- Use the **grid toggle** to show or hide the cell grid overlay.
- Right-click on the screen to pick the existing character and foreground color.
- Use the **Apply color to all** button to recolor all active characters at once.

## Character ROM and Font Library

![Character ROM editor](docs/screenshots/chargen-editor.png)

The font library lets you switch between character ROMs and modify individual glyphs.

### Font features

- The `fonts/` directory is auto-scanned when the page loads.
- Drop any `.bin` ROM file into `fonts/` and refresh to add it.
- Click a font to switch the editor and character picker.
- Upload your own 4KB chargen ROM via the Chargen tab.

### Character editor

- Edit single characters in an 8×8 pixel tile editor.
- Use shift, mirror, invert, and clear operations to customize glyphs.
- Download the modified character ROM when you are done.

## Import / Export

![Import and export tools](docs/screenshots/import-export.png)

The editor supports several export and import formats.

### Export options

- **Patched KERNAL ROM (`.bin`)**: modifies the boot ROM to display your custom screen when the C64 starts.
- **`.PRG` file**: standalone program for previewing the screen in VICE or on real hardware.
- **`.SEQ` file**: raw screen + color data format.
- **JSON**: save and reload the full editor state.
- **Chargen ROM (`.bin`)**: exported character ROM with your custom glyphs.

### Import options

- **Import `.PRG`**: load a stored screen design from a PRG file.
- **Import `.SEQ`**: load raw screen data from a SEQ file.

> Note: SEQ files do not preserve border or background color.

## ROM Patching Modes

### Simple mode

- Changes startup text and colors only.
- Useful if you want a minimal KERNAL patch without replacing the full screen.

### Extended mode

- Injects a complete PETSCII boot screen into the KERNAL.
- Uses compressed machine code to replace the boot banner routine.
- Preserves the normal BASIC warm start behavior after loading.

## How to use the editor

1. Choose or import a template, or start from a blank screen.
2. Draw your design using the tool palette.
3. Pick a font from the Character ROM library if desired.
4. Optionally edit individual characters in the pixel editor.
5. Export your design using the desired format.

## Tips

- Use **Undo / Redo** frequently to recover from mistakes.
- If the font library does not show files, run the server scripts and refresh the page.
- For real hardware, patch the KERNAL ROM and load the modified ROM in your C64 or VICE emulator.

## FAQ

**Q: Why doesn’t the font browser show my `.bin` files?**
A: The font scanner requires a local server to access the `fonts/` directory. Run `start-server.ps1` or Docker to enable it.

**Q: What is the difference between `.PRG` and `.SEQ` exports?**
A: `.PRG` is a preview program that can be loaded and run. `.SEQ` stores only raw screen and color bytes for external tools.

**Q: Can I change the C64 border color?**
A: Yes. Use the global color pickers for border and background colors in the editor.

**Q: Can I use this editor without Docker?**
A: Yes—open `index.html` directly, but the font library requires a server.

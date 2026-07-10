# Local VICE integration

This directory contains the project-side documentation and launcher for testing generated C64 KERNAL images in VICE.

## Current emulator

- **VICE version:** 3.10
- **Build:** SDL2, Windows 64-bit, portable ZIP
- **C64 executable:** `x64sc.exe`
- **Expected local directory:** `vice/SDL2VICE-3.10-win64/`
- **Official release:** <https://github.com/VICE-Team/svn-mirror/releases/tag/3.10.0>
- **Download asset:** `SDL2VICE-3.10-win64.zip`

`x64sc` is VICE's accuracy-focused C64 emulator. The package also contains emulators for other Commodore machines and tools such as `c1541`, `petcat`, and `cartconv`.

## Repository layout

```text
vice/
├── README.md                    tracked
├── run-with-kernal.cmd          tracked
└── SDL2VICE-3.10-win64/         local, Git-ignored
    ├── x64sc.exe
    ├── C64/
    ├── DRIVES/
    └── ...
```

The downloaded emulator binaries are intentionally ignored by Git. This README and `run-with-kernal.cmd` remain in the stable `vice/` root and are explicitly kept by Git, so the emulator directory can be replaced without losing project documentation.

## Install VICE locally

1. Download `SDL2VICE-3.10-win64.zip` from the official release.
2. Extract it directly under `vice/`.
3. Confirm that this file exists:

   ```text
   vice/SDL2VICE-3.10-win64/x64sc.exe
   ```

The currently downloaded ZIP was verified with this SHA-256:

```text
DFA7E0223EA1357BAE988B5C88B332C3B8F80DC3C7A2B51233F50BAB5263DCA5
```

## Run a patched KERNAL

From the repository root in Command Prompt:

```cmd
vice\run-with-kernal.cmd path\to\patched-kernal.bin
```

Example:

```cmd
vice\run-with-kernal.cmd kernal\official-vice-3.10-c64\kernal-901227-03.bin
```

The launcher:

1. Checks that VICE exists in the expected directory.
2. Resolves the supplied KERNAL to an absolute path.
3. Requires an exact size of 8192 bytes.
4. Starts `x64sc.exe` with VICE's `-kernal` option.

The equivalent direct command is:

```cmd
vice\SDL2VICE-3.10-win64\x64sc.exe -kernal "path\to\patched-kernal.bin"
```

Use `start` when the command prompt should return immediately:

```cmd
start "" "vice\SDL2VICE-3.10-win64\x64sc.exe" -kernal "path\to\patched-kernal.bin"
```

Without `start`, Command Prompt waits until VICE closes. That is normal and useful in scripts that need to observe the emulator process.

## KERNAL versus chargen

A C64 KERNAL and a character-generator ROM are separate:

- `-kernal` selects the 8192-byte operating-system and keyboard ROM.
- `-chargen` selects the 4096-byte character glyph ROM.

For a standard patched boot screen, replacing only the KERNAL is normally sufficient.

For localized systems such as Swedish, Danish, or Japanese, use the matching KERNAL and chargen together. Swedish `ÅÄÖ` glyphs come from the chargen ROM; the localized KERNAL supplies the keyboard mapping.

Swedish example:

```cmd
start "" "vice\SDL2VICE-3.10-win64\x64sc.exe" ^
  -kernal "kernal\official-swedish-c64\kernal.325017.swedish-02.bin" ^
  -chargen "kernal\official-swedish-c64\characters.325018-02.bin"
```

Japanese example:

```cmd
start "" "vice\SDL2VICE-3.10-win64\x64sc.exe" ^
  -kernal "kernal\official-vice-3.10-c64\kernal-906145-02.bin" ^
  -chargen "kernal\official-vice-3.10-c64\chargen-906143-02.bin"
```

See [the KERNAL compatibility list](../kernal/README.md) for every known pair and CRC32 value.

## Download and verify ROM files

ROM binaries are local and Git-ignored. Download the known standard and localized files with:

```powershell
.\kernal\download-roms.ps1
```

or:

```bash
./kernal/download-roms.sh
```

Verify existing files from CMD:

```cmd
kernal\verify-rom-crc.cmd
```

The verification succeeds only when all 17 expected files match their recorded CRC32 values.

## Launcher exit codes

| Code | Meaning |
| --- | --- |
| `0` | VICE launch was requested successfully |
| `2` | No KERNAL path was supplied |
| `3` | `x64sc.exe` was not found |
| `4` | The supplied KERNAL file was not found |
| `5` | The supplied file was not exactly 8192 bytes |

## Updating or replacing VICE

To install a newer portable release:

1. Close all running VICE processes.
2. Remove or archive `vice/SDL2VICE-3.10-win64/`.
3. Extract the new portable directory under `vice/`.
4. Update `VICE_HOME` in `run-with-kernal.cmd` if the directory name changed.
5. Update the version, asset name, and checksum in this README.
6. Test the launcher with a known valid KERNAL.

The emulator folder remains ignored regardless of its contents when it matches `vice/SDL2VICE-*/`.

## Troubleshooting

### “VICE was not found”

Check the extracted directory name and ensure `x64sc.exe` exists. If a newer version uses a different directory name, update `VICE_HOME` in `run-with-kernal.cmd`.

### VICE starts but characters are wrong

The selected KERNAL may require a matching chargen. Start VICE with both `-kernal` and `-chargen`; consult the compatibility list.

### The launcher rejects the ROM size

A C64 KERNAL must be exactly 8192 bytes. A combined C64C BASIC+KERNAL image is 16384 bytes and cannot be passed directly as a standalone KERNAL.

### The command appears to hang

When `x64sc.exe` is launched directly from CMD, CMD waits for VICE to close. Use `run-with-kernal.cmd` or the `start "" ...` form for a detached launch.

### ROM checksum fails

Run the appropriate download script again. Do not use a mismatched file simply because it has the correct byte length.

## Useful upstream documentation

- VICE homepage: <https://vice-emu.sourceforge.io/>
- VICE manual: <https://vice-emu.sourceforge.io/vice_toc.html>
- C64 system ROM options (`-kernal`, `-chargen`, `-kernalrev`): <https://vice-emu.sourceforge.io/vice_7.html>
- VICE command-line option index: <https://vice-emu.sourceforge.io/vice_24.html>
- VICE license: `vice/SDL2VICE-3.10-win64/COPYING`

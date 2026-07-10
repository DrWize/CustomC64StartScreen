# donnchawp/DolphinDOS2 1.3

Source: [donnchawp/DolphinDOS2](https://github.com/donnchawp/DolphinDOS2)  
Pinned release: [1.3](https://github.com/donnchawp/DolphinDOS2/releases/tag/1.3)  
Release date: 2026-05-03  
Upstream license: [The Unlicense](https://github.com/donnchawp/DolphinDOS2/blob/1.3/LICENSE)

This is an unofficial, source-available DolphinDOS 2 build intended for Ultimate64, Commodore 64 Ultimate, and VICE. It is not affiliated with the original DolphinDOS developers.

| File | Purpose | Size | CRC32 | SHA-256 |
| --- | --- | ---: | --- | --- |
| `dd2_kernal.rom` | C64 KERNAL | 8192 | `2498254F` | `A862C07380B600B06EDC9E25709D4E0BAC5E523AF7F3FAEEBD1266F35408985B` |
| `dd2_1541.rom` | 1541 drive ROM | 32768 | `CCF3450E` | `CBAFB4265044B2144219222A7CC64AB6DFD3EE498E6DA446185A6FBF0F6BF765` |

The files are downloaded from the exact `1.3` tag rather than the moving `master` branch. ROM binaries are ignored by Git; this provenance and checksum manifest is tracked.

## Required VICE configuration

Upstream documents this setup:

1. Set the machine KERNAL to `dd2_kernal.rom`.
2. Set the 1541 drive ROM to `dd2_1541.rom`.
3. Enable true-drive emulation.
4. Set the drive parallel cable to `Standard`.
5. Enable drive RAM expansions from `$2000` through `$9FFF`; leave `$A000-$BFFF` disabled.
6. Select `Userport parallel drive cable` as the userport device.

VICE should reboot and show `DOLPHINDOS 2.0`.

## Boot-screen patch compatibility

`dd2_kernal.rom` is 8192 bytes and retains both standard markers currently required by this editor:

- Startup banner terminator at the fixed simple-mode offset
- `JSR $E422` at `$E39A`

Simple boot-text patching is structurally compatible.

Extended boot-screen mode is still experimental. It injects code into `$EEBB-$F0BC`, while DolphinDOS replaces routines and disables normal RS-232 use. A patched image may boot but lose DolphinDOS functionality. Keep the original ROM and test both startup and disk operations in VICE.

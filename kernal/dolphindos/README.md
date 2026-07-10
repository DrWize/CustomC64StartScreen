# DolphinDOS ROM archive

Source: [ReplayResources Dolphin DOS](https://rr.c64.org/wiki/Dolphin_DOS)  
Archive: `Kernal_ROM_all_rr.c64.org_2021-02.rar`

The local ROM files were extracted from the preservation archive's `Dolphin_DOS/` directory. ROM binaries are ignored by Git; this manifest contains names and checksums only.

## C64 KERNAL ROMs

| File | Size | Version / note | CRC32 |
| --- | ---: | --- | --- |
| `kernal-10-mager.rom` | 8192 | DolphinDOS 1.0 variant | `C9BB21BC` |
| `kernal-20-1.rom` | 8192 | DolphinDOS 2.0 variant 1 | `C9C4C44E` |
| `kernal-20-1_AU.rom` | 8192 | DolphinDOS 2.0 AU variant | `7068BBCC` |
| `kernal-20-2.rom` | 8192 | DolphinDOS 2.0 variant 2 | `FFAEB9BC` |
| `kernal-20-3.rom` | 8192 | DolphinDOS 2.0 variant 3 | `4FD511F2` |
| `kernal-30.rom` | 8192 | DolphinDOS 3.0 | `5402D643` |

## 1541 drive ROMs

| File | Size | Version / note | CRC32 |
| --- | ---: | --- | --- |
| `c1541-20-6.rom` | 32768 | DolphinDOS 2.0 drive ROM variant | `301D6F2D` |
| `c1541-20-8.rom` | 32768 | DolphinDOS 2.0 drive ROM variant | `94C7FE19` |
| `c1541-20-x.rom` | 32768 | DolphinDOS 2.0 drive ROM variant | `FA960F39` |
| `c1541-30.rom` | 32768 | DolphinDOS 3.0 drive ROM | `C5958530` |

## C128

| File | Size | CRC32 |
| --- | ---: | --- |
| `kernal-dolphin128.rom` | 16384 | `6F4EBFF0` |

## Compatibility warning

DolphinDOS is not only a C64 KERNAL replacement. Full disk acceleration requires a compatible 1541 drive ROM, true-drive emulation, the parallel cable configuration, and the expected drive RAM expansion.

All six 8 KiB C64 KERNAL files retain the standard startup banner marker and `JSR $E422` hook currently checked by this editor. Simple boot-text patching is therefore structurally accepted.

Extended boot-screen mode injects code into `$EEBB-$F0BC`. DolphinDOS disables or replaces standard RS-232 behavior and may use modified code in this region. Extended mode must be treated as experimental: it may display the boot screen while damaging DolphinDOS functionality. Preserve the original ROM and verify disk operations in VICE.

Verify this optional archive separately:

```powershell
.\kernal\verify-rom-crc.ps1 -Manifest .\kernal\dolphindos\roms.crc32
```

```bash
./kernal/verify-rom-crc.sh ./kernal/dolphindos/roms.crc32
```

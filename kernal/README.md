# C64 KERNAL and chargen compatibility

A localized C64 setup normally needs two matching ROMs:

- **KERNAL (8192 bytes):** keyboard mapping and operating-system routines
- **Chargen (4096 bytes):** the visible character glyphs

Using only a Swedish or Danish KERNAL changes the key mapping but does not add the matching glyphs. Use the complete pair below.

## Usual KERNAL and chargen pairings

The KERNAL controls the machine startup, keyboard map, and operating-system
routines. The chargen controls the visible glyphs. In normal C64 use, these are
the pairings to keep together:

| Machine / language | Usual KERNAL | Usual chargen | Why |
| --- | --- | --- | --- |
| Standard international C64 | `kernal-901227-01.bin`, `kernal-901227-02.bin`, or `kernal-901227-03.bin` | `chargen-901225-01.bin` | Standard C64 keyboard and international/US glyphs |
| Swedish C64 | `kernal.325017.swedish-02.bin` | `characters.325018-02.bin` | Swedish keyboard mapping plus ÅÄÖ glyphs |
| Swedish/Finnish C64 alternate dump | `kernal.swedish-03.C2D007.bin` | `characters.325018-02.C2G007.bin` | Matching alternate Swedish/Finnish dump pair |
| Danish C64 | `kernal.901227-03-DK.bin` | `characters.901225-01-DK.bin` | Danish keyboard mapping and Danish glyph layout |
| Japanese C64 | `kernal-906145-02.bin` | `chargen-906143-02.bin` | Japanese C64 KERNAL must use its matching Japanese chargen |
| SX-64 | `kernal-251104-04.bin` | `chargen-901225-01.bin` | SX-64 uses the standard C64 character set |
| C64 Games System | `kernal-390852-01.bin` | `chargen-901225-01.bin` | Uses the standard C64 character set |
| Educator 64 / Commodore 4064 | `kernal-901246-01.bin` | `chargen-901225-01.bin` | Uses the standard C64 character set |
| DolphinDOS / DolphinDOS2 on a standard-language C64 | DolphinDOS C64 KERNAL, for example `dd2_kernal.rom` | `chargen-901225-01.bin` | DolphinDOS replaces disk routines, not the visible character set |

Fastloader KERNALs such as DolphinDOS or JiffyDOS normally keep using the
machine's regular chargen ROM. For a Swedish, Danish, or Japanese machine, keep
the localized chargen even if the KERNAL has been replaced by a fastloader,
provided that fastloader ROM was built for that same keyboard/layout.

| Use | KERNAL | CRC32 | Chargen | CRC32 | Notes |
| --- | --- | --- | --- | --- | --- |
| Standard C64, revision 1 | `official-vice-3.10-c64/kernal-901227-01.bin` | `DCE782FA` | `official-vice-3.10-c64/chargen-901225-01.bin` | `EC4272EE` | Standard international/US character set |
| Standard C64, revision 2 | `official-vice-3.10-c64/kernal-901227-02.bin` | `A5C687B3` | `official-vice-3.10-c64/chargen-901225-01.bin` | `EC4272EE` | Standard international/US character set |
| Standard C64, revision 3 | `official-vice-3.10-c64/kernal-901227-03.bin` | `DBE3E7C7` | `official-vice-3.10-c64/chargen-901225-01.bin` | `EC4272EE` | Recommended standard C64 pair |
| Swedish | `official-swedish-c64/kernal.325017.swedish-02.bin` | `8F294C51` | `official-swedish-c64/characters.325018-02.bin` | `377A382B` | Swedish mapping and ÅÄÖ glyphs |
| Swedish/Finnish, alternate dump | `official-swedish-c64/kernal.swedish-03.C2D007.bin` | `F10C2C25` | `official-swedish-c64/characters.325018-02.C2G007.bin` | `BEE9B3FD` | Matching C2D007/C2G007 pair |
| Danish | `official-swedish-c64/kernal.901227-03-DK.bin` | `1DC8A998` | `official-swedish-c64/characters.901225-01-DK.bin` | `F649EC3A` | Danish keyboard and glyph mapping |
| Japanese C64 | `official-vice-3.10-c64/kernal-906145-02.bin` | `3A9EF6F1` | `official-vice-3.10-c64/chargen-906143-02.bin` | `1604F6C1` | Must use the Japanese pair together |
| SX-64 | `official-vice-3.10-c64/kernal-251104-04.bin` | `2C5965D4` | `official-vice-3.10-c64/chargen-901225-01.bin` | `EC4272EE` | Uses standard chargen |
| C64 Games System | `official-vice-3.10-c64/kernal-390852-01.bin` | `505365D4` | `official-vice-3.10-c64/chargen-901225-01.bin` | `EC4272EE` | Uses standard chargen |
| Educator 64 / 4064 | `official-vice-3.10-c64/kernal-901246-01.bin` | `789C8CC5` | `official-vice-3.10-c64/chargen-901225-01.bin` | `EC4272EE` | Uses standard chargen |
| DolphinDOS2 1.3 | `dolphindos2-github-1.3/dd2_kernal.rom` | `2498254F` | `official-vice-3.10-c64/chargen-901225-01.bin` | `EC4272EE` | Also requires `dd2_1541.rom`, parallel cable, and drive RAM |

All binary ROM files below `kernal/` are local-only and ignored by Git. The Markdown manifests contain names and checksums only.

## Boot-screen patch compatibility with fastload KERNALs

The boot-screen patcher has two relevant modes:

- **Simple mode** changes the existing startup text and colors in-place:
  `$E475`, `$E49A`, `$E535`, `$ECD9`, and `$ECDA`.
- **Extended mode** replaces the startup-message call at `$E39A` and injects
  up to 514 bytes into `$EEBB-$F0BC`.

That distinction matters for fastload replacement KERNALs:

| KERNAL | Simple mode | Extended mode | Why |
| --- | --- | --- | --- |
| Standard Commodore KERNAL rev. 1/2/3 | Safe | Safe | The extended patch uses the normal unused/replaceable RS-232 area. |
| JiffyDOS 6.01 | Likely safe | Compatible by layout | JiffyDOS initializes before our `$E39A` hook, and its fast serial routines live mainly after the extended patch area. |
| DolphinDOS / DolphinDOS2 | Likely safe | Do not use | DolphinDOS stores parallel fast LOAD/SAVE code inside `$EEBB-$F0BC`, which is exactly where extended mode injects boot-screen code. |

### JiffyDOS notes

JiffyDOS 6.01 keeps the normal startup path layout around the boot message:

- `$E394`: JiffyDOS command/function-key initialization
- `$E397`: BASIC initialization
- `$E39A`: startup-message call, which is the call our extended patch hooks

Because JiffyDOS initialization has already run by `$E39A`, the boot-screen hook
does not skip that setup. The JiffyDOS fast serial code is stored elsewhere,
not in the `$EEBB-$F0BC` extended boot-screen injection window:

- `$FAC4`: patched LOAD entry / fallback to the original loader
- `$FB3E-$FB96`: fast LOAD transfer routine
- `$FBA5-$FBFD`: fast byte receive path
- `$FBFE-$FCxx`: serial send/patch routines
- `$F0D8`: sprite/timing helper just after the boot-screen injection area
- zero-page state includes `$A3`, `$9F`, `$BE`, and temporary values in `$B0-$B2`

Verdict: JiffyDOS should work with simple mode, and JiffyDOS 6.01 is compatible
with extended mode by ROM layout. Still fingerprint the exact ROM before patching,
because other JiffyDOS versions or patched variants may move code.

### DolphinDOS notes

DolphinDOS is different: it replaces the standard serial loading path with
parallel fast LOAD/SAVE logic and uses the C64 user port/CIA2 lines around
`$DD00/$DD01`. It also needs the matching 1541 drive ROM, parallel cable, true
drive emulation, and drive RAM expansion for the full fastloader setup.

DolphinDOS2 1.3 changes 511 of the 514 bytes in the current extended-mode
injection window `$EEBB-$F0BC` compared with the stock C64 rev. 3 KERNAL. That
means extended mode would overwrite DolphinDOS fastload code.

Verdict: allow only simple in-place boot-screen patches for DolphinDOS-family
KERNALs unless a different safe injection area is implemented. Extended mode
should reject known DolphinDOS fingerprints.

## Download sources

ROM binaries are local-only and ignored by Git. The tracked files document where
to get them, where the download scripts place them, and which CRC32 each file
must have.

| ROM family | Source | Local destination |
| --- | --- | --- |
| Standard C64, Japanese C64, SX-64, C64 Games System, Educator 64 / 4064 | Official [VICE Team 3.10 release](https://github.com/VICE-Team/svn-mirror/releases/tag/3.10.0), extracted from `SDL2VICE-3.10-win64.zip` | `kernal/official-vice-3.10-c64/` |
| Swedish, Swedish/Finnish, Danish | [Zimmers.NET Commodore 64 firmware archive](https://www.zimmers.net/anonftp/pub/cbm/firmware/computers/c64/), formerly the FTP archive at `ftp.funet.fi` | `kernal/official-swedish-c64/` |
| DolphinDOS2 1.3 | [`donnchawp/DolphinDOS2`](https://github.com/donnchawp/DolphinDOS2), pinned to release [`1.3`](https://github.com/donnchawp/DolphinDOS2/releases/tag/1.3) | `kernal/dolphindos2-github-1.3/` |
| DolphinDOS preservation archive | [ReplayResources Dolphin DOS](https://rr.c64.org/wiki/Dolphin_DOS) | `kernal/dolphindos/` |
| JiffyDOS | Commercial/proprietary ROM. Obtain a legal copy from an authorized JiffyDOS seller; it is not downloaded or redistributed by this project. | user-supplied only |

Download and verify every listed ROM automatically:

```powershell
.\kernal\download-roms.ps1
```

```bash
./kernal/download-roms.sh
```

The PowerShell version uses built-in PowerShell archive support. The Bash version requires `curl`, `unzip`, and Python 3. Both scripts download to temporary storage, copy only the required ROMs, remove temporary files, and finish by checking all CRC32 values.

## Verify downloaded ROMs

From Command Prompt:

```cmd
kernal\verify-rom-crc.cmd
```

From PowerShell:

```powershell
.\kernal\verify-rom-crc.ps1
```

From Bash on Linux/macOS/Git Bash:

```bash
./kernal/verify-rom-crc.sh
```

The Bash verifier requires Python 3 and uses its standard-library CRC32 implementation.

The verifier reads `roms.crc32`, checks all 17 automatically downloaded ROMs, and reports `[OK]`, `[MISSING]`, or `[BAD]`. It exits with code `0` only when every file has the expected CRC32; missing or incorrect files return code `1`. The optional ReplayResources archive has its own manifest under `dolphindos/`.

# Official C64-family KERNAL images from VICE 3.10

These seven 8192-byte ROM images were copied from the official portable VICE 3.10 SDL2 Windows distribution.

The directory also contains the two matching chargen ROMs:

| File | Use | CRC32 |
| --- | --- | --- |
| `chargen-901225-01.bin` | Standard C64, SX-64, C64GS, and Educator 64 | `EC4272EE` |
| `chargen-906143-02.bin` | Japanese C64, paired with `kernal-906145-02.bin` | `1604F6C1` |

| File | Machine / revision | CRC32 |
| --- | --- | --- |
| `kernal-901227-01.bin` | Standard C64 KERNAL revision 1 | `DCE782FA` |
| `kernal-901227-02.bin` | Standard C64 KERNAL revision 2 | `A5C687B3` |
| `kernal-901227-03.bin` | Standard C64 KERNAL revision 3 | `DBE3E7C7` |
| `kernal-906145-02.bin` | Japanese C64 | `3A9EF6F1` |
| `kernal-251104-04.bin` | SX-64 | `2C5965D4` |
| `kernal-390852-01.bin` | C64 Games System | `505365D4` |
| `kernal-901246-01.bin` | Educator 64 / Commodore 4064 | `789C8CC5` |

The three standard C64 KERNAL revisions are `901227-01`, `901227-02`, and `901227-03`. If “C64 KERNAL version 3” is meant literally, the relevant image is only `kernal-901227-03.bin`.

The binary ROM files are kept local and ignored by Git. This manifest may be committed without redistributing ROM contents.

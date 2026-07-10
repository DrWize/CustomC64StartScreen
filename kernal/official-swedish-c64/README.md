# Swedish and Danish C64 ROM pairs

The Swedish letters `Å`, `Ä`, and `Ö` are stored in the character-generator (chargen) ROM. The matching KERNAL provides the corresponding keyboard mapping. Use both files from the same pair.

| Pair | File | Purpose | CRC32 |
| --- | --- | --- | --- |
| Swedish 325017/325018 | `kernal.325017.swedish-02.bin` | Swedish keyboard KERNAL | `8F294C51` |
| Swedish 325017/325018 | `characters.325018-02.bin` | Swedish chargen with ÅÄÖ glyphs | `377A382B` |
| Swedish C2D007/C2G007 | `kernal.swedish-03.C2D007.bin` | Swedish/Finnish keyboard KERNAL dump | `F10C2C25` |
| Swedish C2D007/C2G007 | `characters.325018-02.C2G007.bin` | Matching Swedish chargen with ÅÄÖ glyphs | `BEE9B3FD` |
| Danish 901227/901225 | `kernal.901227-03-DK.bin` | Danish keyboard KERNAL | `1DC8A998` |
| Danish 901227/901225 | `characters.901225-01-DK.bin` | Matching Danish chargen | `F649EC3A` |

## Notes on the Swedish/Finnish variants

The old FUNET/Zimmers archive notes say that Swedish/Finnish-localized C64
KERNALs existed as patched variants of Commodore KERNAL revisions `901227-02`
and `901227-03`, plus a localized SX-64 KERNAL based on `251104-04`.

The `C2D007/C2G007` names are archive/dump labels, not a separate C64 model
name. Zimmers lists `characters.325018-02.C2G007.bin` as a Swedish C64 chargen
dump and `kernal.swedish-03.C2D007.bin` as a localized KERNAL dump from a unit
with chip labels dated/marked around `8407`. The labels in the archive text are
slightly inconsistent between KERNAL and chargen, so keep the pair together by
filename and CRC rather than by assuming the printed chip code alone tells the
whole story.

Community reports also describe Swedish/Finnish C64s appearing both with real
localized keycaps and with sticker/ROM upgrade kits. Handic reportedly sold
stickers and ROMs separately for upgrading non-Swedish machines. That explains
why Swedish/Finnish ROM dumps can show up in machines that do not all look
identical externally.

For Swedish `ÅÄÖ`, start with the `325017/325018` pair. The ROM binaries are local-only and ignored by Git; this checksum manifest contains no ROM data.

Sources: Zimmers.NET Commodore firmware archive, historical FUNET archive notes,
and community reports collected by Breadbox64.

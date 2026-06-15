# Test Files for Kaleidoscope ↔ C64 Boot Screen Editor

These test files are designed to verify compatibility between **Kaleidoscope** PETSCII editor and **C64 Boot Screen Editor**.

---

## 📁 Available Test Files

| File | Format | Size | Description |
|------|--------|------|-------------|
| [`kaleidoscope-test.prg`](kaleidoscope-test.prg) | C64 PRG | 2002 bytes | **Recommended** - Full screen + colors, load address $0400 |
| [`kaleidoscope-test.seq`](kaleidoscope-test.seq) | SEQ | 2000 bytes | Screen RAM + Color RAM |
| [`kaleidoscope-test-screen-only.seq`](kaleidoscope-test-screen-only.seq) | SEQ | 1000 bytes | Screen RAM only (no colors) |

---

## 🎨 Design Preview

```
**************************************
*                                     *
*  C64 BOOT TEST SCREEN               *
*                                     *
*  BY KALEIDOSCOPE                   *
*                                     *
*                                     *
*                                     *
*                                     *
*                                     *
*                                     *
*                                     *
*                                     *
*                                     *
*                                     *
*                                     *
*                                     *
*                                     *
*                                     *
*                                     *
*                                     *
*                                     *
***************************************
```

**Design Details:**
- **Size**: 40×25 characters (full C64 screen)
- **Characters**: Spaces, asterisks (`*`), text letters
- **Colors**: Light blue (14) background, white (1) text
- **Unique Characters**: ~15 (highly compressible)
- **Unique Colors**: 2 (perfect for RLE compression)

---

## 🧪 Test Procedures

### Test 1: PRG File Import
1. **In Kaleidoscope**: Load `kaleidoscope-test.prg`
2. **In C64 Boot Screen Editor**: Click "Import .PRG" → Select file
3. **Verify**: Design appears with borders and text
4. **Expected**: ✅ Success

### Test 2: SEQ File Import  
1. **In C64 Boot Screen Editor**: Click "Import .SEQ" → Select file
2. **Verify**: All characters and colors load correctly
3. **Expected**: ✅ Success

### Test 3: ROM Patching
1. Upload a KERNAL ROM file
2. Import the test design (PRG or SEQ)
3. Click "Download Extended Patch"
4. Test in VICE emulator
5. **Expected**: ✅ Custom boot screen appears

---

## 📊 Compression Analysis

| Format | Uncompressed | RLE Compressed* | Fits in 514 bytes? |
|--------|--------------|-----------------|---------------------|
| PRG (2002 bytes) | 2002 | ~150-180 bytes | ✅ **YES** |
| SEQ (2000 bytes) | 2000 | ~150-180 bytes | ✅ **YES** |
| SEQ (1000 bytes) | 1000 | ~80-100 bytes | ✅ **YES** |

*Estimated RLE compression for this design with repetitive patterns

---

## 🔧 Technical Details

### PRG File Format
- **Load Address**: $0400 (screen memory start)
- **Structure**: [2-byte load address][1000-byte screen RAM][1000-byte color RAM]
- **Compatible**: Kaleidoscope, most C64 PETSCII editors

### SEQ File Format
- **Structure**: [1000-byte screen RAM][1000-byte color RAM]
- **Compatible**: Standard PETSCII interchange format

---

## 🎯 Expected Results

✅ **All tests should pass** - design is intentionally simple to ensure:
- Perfect import compatibility
- Excellent RLE compression (under 300 bytes)
- No errors during import or ROM patching
- Works within the 514-byte injection limit

---

## 📝 Usage Notes

- These files use **only basic PETSCII characters** (no custom charset)
- **Color RAM format** is standard C64 (1 nibble per cell)
- **Screen codes** are standard (0-255)
- **No special features** - designed for maximum compatibility

---

## 🚀 Next Steps

After successful testing:
1. ✅ PRG import is working
2. ✅ SEQ import is working  
3. ✅ ROM patching works with imported designs
4. **Try your own Kaleidoscope files!**

---

*Created: 2026-06-15*  
*For: C64 Boot Screen Editor ↔ Kaleidoscope compatibility testing*
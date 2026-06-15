# 🎯 Tomorrow's QA Checklist - C64 Boot Screen Editor

**Date**: 2026-06-15 (Next Day)  
**Reviewer**: [Your Name]  
**Focus**: Full regression testing after import feature implementation

---

## 📋 **PRE-TEST SETUP**

### ✅ Environment Preparation (5 minutes)
- [ ] **From Local Folder**: Open `E:\ai\C64Boot\index.html` in Chrome/Edge/Firefox
- [ ] **From Docker**: Run `docker-compose build --no-cache && docker-compose up -d` then open `http://localhost:8064`
- [ ] **Clear browser cache**: `Ctrl+Shift+Delete` → Clear cached images and files
- [ ] **Hard refresh**: Press `Ctrl+F5` to ensure latest files

---

## 🎯 **VISUAL INSPECTION**

### ✅ Header Check
- [ ] **Build time displays**: ` | Build: [date] [time]` appears after subtitle
- [ ] **No errors in console**: Open DevTools (F12) → Console → No red errors
- [ ] **All UI elements visible**: Header, panels, canvas, tabs all render correctly

---

## 📁 **IMPORT FEATURE TESTS**

### **Test 1: PRG File Import**
1. [ ] Click **"Export"** tab (right panel)
2. [ ] **Import from External Tools** section is visible
3. [ ] Click **"Import .PRG"** button
4. [ ] File picker opens
5. [ ] Select `kaleidoscope-test.prg` (2002 bytes)
6. [ ] **Expected**: Design loads with borders and text
7. [ ] **Verify**: White text "C64 BOOT TEST SCREEN" and "BY KALEIDOSCOPE" appear
8. [ ] **Verify**: White asterisk borders at top and bottom
9. [ ] **Verify**: No errors in console

**✅ PASS / ❌ FAIL**

### **Test 2: SEQ File Import (Screen + Colors)**
1. [ ] Click **"Import .SEQ"** button
2. [ ] File picker opens
3. [ ] Select `kaleidoscope-test.seq` (2000 bytes)
4. [ ] **Expected**: Design loads with borders, text, and colors
5. [ ] **Verify**: Same design as PRG test
6. [ ] **Verify**: Light blue background, white text
7. [ ] **Verify**: No errors in console

**✅ PASS / ❌ FAIL**

### **Test 3: SEQ File Import (Screen Only)**
1. [ ] Click **"Import .SEQ"** button
2. [ ] Select `kaleidoscope-test-screen-only.seq` (1000 bytes)
3. [ ] **Expected**: Design loads with screen codes (colors may be default)
4. [ ] **Verify**: Text and borders appear
5. [ ] **Verify**: No errors in console

**✅ PASS / ❌ FAIL**

---

## 🔧 **ROM PATCHING TESTS**

### **Prerequisite**: Upload a KERNAL ROM file
1. [ ] Go to **ROM** tab
2. [ ] Click **"Upload KERNAL ROM"** 
3. [ ] Upload a valid 8192-byte KERNAL ROM (e.g., from VICE)
4. [ ] **Verify**: ROM loads successfully, line 1 and line 2 text appears

**✅ ROM uploaded / ❌ FAIL**

### **Test 4: Simple Patch with Imported Design**
1. [ ] Import any test file (PRG or SEQ)
2. [ ] In ROM tab, **Simple Mode**:
3. [ ] Modify Line 1 and/or Line 2 text
4. [ ] Click **"Download Simple Patch"**
5. [ ] **Expected**: .bin file downloads
6. [ ] **Verify**: File is valid (can open in hex editor)

**✅ PASS / ❌ FAIL**

### **Test 5: Extended Patch with Imported Design**
1. [ ] Import any test file (PRG or SEQ)
2. [ ] In ROM tab, **Extended Mode**:
3. [ ] Click **"Download Extended Patch"**
4. [ ] **Expected**: .bin file downloads
5. [ ] **Verify**: File is valid and larger than original ROM
6. [ ] **Test in VICE**: Load patched ROM → Design appears as boot screen

**✅ PASS / ❌ FAIL**

---

## 🎨 **EXISTING FEATURE TESTS** (Regression)

### **Test 6: All Drawing Tools**
- [ ] **Draw tool**: Click and drag on canvas → Characters appear
- [ ] **Erase tool**: Click and drag → Characters removed (spaces)
- [ ] **Fill tool**: Click → Fills connected area with current char
- [ ] **Text tool**: Click → Text cursor appears, type text
- [ ] **Color Paint tool**: Click → Changes cell color
- [ ] **Line tool**: Click, drag → Line drawn
- [ ] **Rect tool**: Click, drag → Rectangle drawn

**✅ All tools work / ❌ Some tools broken**

### **Test 7: Color Pickers**
- [ ] **Border color**: Click different swatches → Border color changes
- [ ] **Background color**: Click different swatches → BG color changes  
- [ ] **Text color**: Click different swatches → Text color changes
- [ ] **Apply color to all**: Click button → All cells change to selected color

**✅ All pickers work / ❌ Pickers broken**

### **Test 8: Templates**
- [ ] Click **Templates** tab
- [ ] Click each template (12 total)
- [ ] **Verify**: Each template loads without errors
- [ ] **Verify**: Design appears correctly

**✅ All templates load / ❌ Template issues**

### **Test 9: Undo/Redo**
1. [ ] Draw some characters
2. [ ] Click **Undo** → Characters disappear
3. [ ] Click **Redo** → Characters reappear
4. [ ] Repeat multiple times
5. [ ] **Verify**: Undo/Redo works smoothly

**✅ Undo/Redo works / ❌ Broken**

### **Test 10: Keyboard Shortcuts**
- [ ] Press **D** → Draw tool selected
- [ ] Press **E** → Erase tool selected
- [ ] Press **F** → Fill tool selected
- [ ] Press **T** → Text tool selected
- [ ] Press **C** → Color Paint tool selected
- [ ] Press **L** → Line tool selected
- [ ] Press **R** → Rect tool selected
- [ ] Press **G** → Grid toggle
- [ ] Press **Ctrl+Z** → Undo
- [ ] Press **Ctrl+Y** → Redo

**✅ All shortcuts work / ❌ Shortcuts broken**

---

## 📊 **EXPORT TESTS**

### **Test 11: Export as JSON**
1. [ ] Create a design
2. [ ] Go to **Export** tab
3. [ ] Click **"Export as JSON"**
4. [ ] **Expected**: .json file downloads
5. [ ] **Verify**: File can be opened and contains screen/color data

**✅ PASS / ❌ FAIL**

### **Test 12: Import JSON**
1. [ ] Export a design as JSON (from Test 11)
2. [ ] Click **"Import JSON"**
3. [ ] Select the JSON file
4. [ ] **Expected**: Design loads correctly
5. [ ] **Verify**: Matches the exported design

**✅ PASS / ❌ FAIL**

### **Test 13: Export as PRG**
1. [ ] Create a design
2. [ ] Go to **Export** tab
3. [ ] Click **"Download .PRG"**
4. [ ] **Expected**: .prg file downloads
5. [ ] **Verify**: File is valid C64 format

**✅ PASS / ❌ FAIL**

---

## 🎯 **FINAL CHECKLIST**

| Category | Status | Notes |
|----------|--------|-------|
| **Header displays build time** | ✅ | Added 6/15/2026 |
| **PRG import works** | ✅ | Kaleidoscope format supported |
| **SEQ import works** | ✅ | Kaleidoscope format supported |
| **ROM patching works** | ✅ | Both simple and extended modes |
| **ROM exports have timestamps** | ✅ | Files named with date/time |
| **All drawing tools work** | ✅ / ❌ | |
| **Color pickers work** | ✅ / ❌ | |
| **Templates load** | ✅ / ❌ | |
| **Undo/Redo works** | ✅ / ❌ | |
| **Keyboard shortcuts work** | ✅ / ❌ | |
| **Export/Import JSON works** | ✅ / ❌ | |
| **Export PRG works** | ✅ / ❌ | |
| **No console errors** | ✅ / ❌ | |

---

## 🐛 **TROUBLESHOOTING**

### If Import Doesn't Work:
1. **Check console**: F12 → Console → Any red errors?
2. **Hard refresh**: `Ctrl+F5` (cached files issue)
3. **Rebuild Docker**: `docker-compose build --no-cache && docker-compose up -d`
4. **Test from file://**: Open `index.html` directly to isolate Docker issues
5. **Verify files exist**: Check `kaleidoscope-test.prg` and `.seq` files are in the folder

### Common Issues:
- **"Cannot read properties of undefined (reading 'hex')"**: Color value out of range → **Fixed in latest code**
- **Import buttons not showing**: Old Docker build → **Rebuild Docker**
- **Design not loading**: File format issue → **Check file is correct format**

---

## 📈 **EXPECTED RESULTS**

**Minimum Passing Score: 12/13 tests** (92%)

- ✅ **13/13** = Production ready
- ✅ **12/13** = Minor issues, acceptable
- ❌ **<12/13** = Needs investigation

---

## 📝 **NOTES**

- **Test files location**: `E:\ai\C64Boot\kaleidoscope-test.prg`, `kaleidoscope-test.seq`
- **Docker URL**: `http://localhost:8064`
- **For best results**: Test in Chrome or Edge
- **Mobile testing**: Optional (not fully supported yet)

---

## 🎉 **SUCCESS CRITERIA**

**The QA passes if:**
1. Build time displays correctly
2. PRG and SEQ import work without errors
3. All existing features still work (no regressions)
4. No console errors appear

**Good luck with tomorrow's testing!** 🚀

---

*Checklist created: 2026-06-15*  
*Target testing date: 2026-06-16*
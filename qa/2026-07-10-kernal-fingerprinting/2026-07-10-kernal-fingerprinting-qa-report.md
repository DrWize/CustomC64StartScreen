# QA report: KERNAL fingerprinting and VICE/KERNAL documentation

Date: 2026-07-10  
Branch: `feature/vice-patched-kernal`

## Scope

This QA run covers the new KERNAL CRC32 fingerprinting, unknown-KERNAL warnings,
DolphinDOS extended-mode blocking, KERNAL/VICE documentation, ROM checksum
manifests, and Docker runtime packaging.

Post-QA documentation updates before commit:

- Added a central KERNAL download-source table covering VICE, Zimmers/FUNET,
  DolphinDOS2, ReplayResources DolphinDOS, and user-supplied JiffyDOS.
- Added usual KERNAL/chargen pairing notes.
- Added historical notes for the Swedish/Finnish `C2D007/C2G007` dump labels.
- Corrected the VICE README ROM verification count from 15 to 17 files.

## Result

Pass, with two issues found and fixed during QA:

1. `js/rom-patcher.js` had one unquoted CRC32 object key beginning with a digit
   (`3A9EF6F1`), which failed JavaScript syntax validation. Fixed by quoting it.
2. `.dockerignore` did not exclude the downloaded/extracted VICE emulator tree.
   Docker build context was about 106 MB. Fixed by ignoring local ROM/emulator
   downloads; rebuilt context is about 50 KB.

## Checks performed

### Git and whitespace

Command:

```powershell
git diff --check
```

Result: passed. Git reported only LF-to-CRLF working-copy warnings.

### Main ROM manifest verification

Command:

```powershell
.\kernal\verify-rom-crc.ps1
```

Result: passed.

- 17 passed
- 0 missing
- 0 incorrect

### DolphinDOS ROM manifest verification

Command:

```powershell
.\kernal\verify-rom-crc.ps1 -Manifest .\kernal\dolphindos\roms.crc32
```

Result: passed.

- 11 passed
- 0 missing
- 0 incorrect

### KERNAL profile coverage

Command:

```powershell
python -c "<profile coverage check>"
```

Result: passed.

- Browser profile table: 17 known 8 KB KERNAL CRC32 values
- Manifest 8 KB KERNALs: 17
- Missing profiles: none

### JavaScript syntax and core regression

Command:

```powershell
docker run --rm -v ${PWD}:/work -w /work node:22-alpine sh -lc "node --check js/rom-patcher.js && node --check js/app.js && node qa/2026-07-06-full-regression/2026-07-06-node-core-regression.js"
```

Result: passed.

Output:

```text
QA regression tests passed.
```

Note: local `node`/`npm` are not installed/in PATH, so Node checks were run in
a temporary Docker container.

### Docker build

Command:

```powershell
docker build -t c64boot-editor:qa-2026-07-10 .
```

Result: passed.

Final build-context transfer after `.dockerignore` fix:

```text
transferring context: 49.96kB
```

### Docker runtime smoke test

Command:

```powershell
docker run -d --name c64boot-qa-20260710 -p 18064:8064 c64boot-editor:qa-2026-07-10
```

Result: passed. Container health check reported `healthy`.

HTTP checks:

```text
200 index.html
200 css/styles.css
200 js/app.js
200 js/c64-data.js
200 js/rom-patcher.js
200 js/screen-editor.js
200 js/chargen-editor.js
200 js/templates.js
200 README.md
200 kernal/README.md
200 vice/README.md
```

### Docker image content spot check

Result: passed.

The Docker image contains tracked documentation/scripts under `kernal/` and
`vice/`, but excludes local binary ROM and VICE emulator downloads.

## Not covered

- Full interactive browser QA was not run with a real browser automation stack.
- VICE boot validation of generated patched ROMs was not run in this QA pass.

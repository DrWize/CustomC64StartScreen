# C64 Boot Screen Editor — Full QA Report

**Date:** 2026-07-06  
**Branch:** `new-branch`  
**Baseline commit:** `10de091`  
**Environment:** Windows, Docker Desktop 4.81.0, Docker Engine 29.6.1, Apache 2.4 Alpine, Node 22 Alpine, headless Google Chrome

## Result

**PASS — no release-blocking defects found.**

| Area | Result |
| --- | --- |
| JavaScript syntax | 7/7 files passed |
| Existing Node regression suite | Passed |
| Browser UI regression suite | 20/20 passed |
| Docker build | Passed |
| Docker healthcheck | Healthy, 0 restarts |
| Runtime HTTP assets | All returned HTTP 200 |
| Duplicate HTML IDs | None |
| Git whitespace validation | Passed |

## Browser regression coverage

The browser suite runs against the application served by the rebuilt Docker image. It verifies:

1. Application initialization and required controls
2. Default screen rendering
3. Every template button
4. Draw, erase, undo, and redo
5. Flood fill
6. Line and rectangle bounds
7. Selection copy, cut, paste, and movement
8. Selection boundary protection
9. Keyboard tool shortcuts
10. Black color handling
11. JSON valid round-trip and invalid-input rejection
12. PRG binary and FileReader round-trips
13. SEQ binary and FileReader round-trips
14. Simple and extended 8 KB KERNAL patch generation
15. Live Preview dialog and canvas transfer
16. Row insertion and deletion

Automated browser result: **20/20 passed; 0 failed**.

## Docker and packaging

- A clean image build completed successfully.
- The container reached `healthy` and remained at zero restarts.
- `/`, CSS, all six JavaScript modules, `/fonts/`, and `/kernal/` returned HTTP 200.
- The QA browser page was served from the newly built image, not copied into the running container.
- Docker build context was reduced from 62.11 MB to 14.44 KB after excluding temporary browser QA artifacts and removing obsolete historical test material.

## Finding resolved during QA

### QA-2026-07-06-01 — Temporary browser profiles entered Docker context

- **Severity:** Low
- **Impact:** Slower builds and unnecessarily large build context; no runtime defect.
- **Resolution:** Added `.qa-chrome*`, `qa-browser-*.txt`, and `qa-browser-*.png` to `.dockerignore`; removed generated artifacts.
- **Retest:** Passed. Context reduced to 14.44 KB.

## Residual limitations

These require external environments and were not claimed as verified:

- Booting the generated KERNAL in VICE
- Booting on physical Commodore 64 hardware
- Firefox, Safari, and mobile browser compatibility
- Visual accuracy across different physical CRT displays
- RS-232 behavior after an extended KERNAL patch (the feature intentionally reuses that ROM area)

The binary generation and round-trip paths underlying PRG, SEQ, and KERNAL output were tested successfully.

## Reproducible tests

- Browser suite: `2026-07-06-browser-ui-regression.html`
- Node suite: `2026-07-06-node-core-regression.js`

Run the Node suite from the repository root:

```powershell
docker run --rm -v "${PWD}:/app" -w /app node:22-alpine node qa/2026-07-06-full-regression/2026-07-06-node-core-regression.js
```

After starting Docker Compose, run the browser suite at:

```text
http://localhost:8064/qa/2026-07-06-full-regression/2026-07-06-browser-ui-regression.html
```

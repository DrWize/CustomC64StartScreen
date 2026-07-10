# Project dependencies and local downloads

This project is intentionally mostly static: the editor itself has no npm
package install step and no CDN runtime dependency. The optional local files
below are downloaded into ignored folders so they are available for testing but
are not redistributed by Git.

## Download everything local

From PowerShell on Windows:

```powershell
.\download-dependencies.ps1
```

From Bash on Linux/macOS/Git Bash:

```bash
./download-dependencies.sh
```

These scripts download:

| Dependency | Source | Local path | Notes |
| --- | --- | --- | --- |
| Optional C64 chargen/font ROMs | `patrickmollohan/c64-fonts` raw GitHub files | `fonts/*.bin` | Used by the font library. Git-ignored. |
| Standard C64-family ROMs | VICE Team 3.10 release ZIP | `kernal/official-vice-3.10-c64/` | Extracted from `SDL2VICE-3.10-win64.zip`. Git-ignored binaries, tracked checksums. |
| Swedish/Finnish/Danish ROMs | Zimmers.NET Commodore firmware archive | `kernal/official-swedish-c64/` | Git-ignored binaries, tracked checksums. |
| DolphinDOS2 1.3 ROMs | `donnchawp/DolphinDOS2` release `1.3` raw ROM files | `kernal/dolphindos2-github-1.3/` | Git-ignored binaries, tracked checksums. |
| VICE emulator | VICE Team 3.10 release asset `SDL2VICE-3.10-win64.zip` | `vice/SDL2VICE-3.10-win64/` | Portable Windows emulator used by `vice/run-with-kernal.cmd`. Git-ignored. |

The ROM download script verifies the tracked CRC32 manifests after downloading.
The VICE emulator ZIP is verified with SHA-256 before extraction.

## Tools used by development and QA

| Tool | Used for | Install note |
| --- | --- | --- |
| Browser | Running the editor | Any modern browser should work. |
| Docker Desktop / Docker Engine | Local Apache HTTPD runtime and QA Node container | Needed for `docker compose up`, Docker smoke tests, and Node QA without installing Node locally. |
| Python 3 | Local static server and portable CRC checks in Bash verifier | Used by `start-server.*` and `kernal/verify-rom-crc.sh`. |
| PowerShell | Windows download/verify scripts | Built into modern Windows. |
| Bash + `curl` + `unzip` | Bash download scripts | Required only for the `.sh` scripts. |
| Node.js 22 | JavaScript syntax/regression QA | No local install required if using `docker run --rm node:22-alpine ...`. |

## Files intentionally not committed

These are downloaded locally but ignored by Git and Docker build context:

- `fonts/*.bin`
- `kernal/**/*.bin`
- `kernal/**/*.rom`
- `vice/SDL2VICE-*/`
- downloaded ZIP/archive files

## Proprietary/user-supplied ROMs

JiffyDOS is commercial/proprietary and is not downloaded by this project. Use a
legally obtained ROM and upload it manually in the browser. Unknown KERNALs are
fingerprinted by CRC32 and shown with a warning before risky extended patching.


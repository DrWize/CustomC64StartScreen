#!/usr/bin/env bash
set -uo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
manifest="${1:-${script_dir}/roms.crc32}"

if ! command -v python3 >/dev/null 2>&1; then
    echo "Error: python3 is required to calculate portable CRC32 checksums." >&2
    exit 2
fi

python3 - "$manifest" <<'PY'
from pathlib import Path
import re
import sys
import zlib

manifest = Path(sys.argv[1]).resolve()
if not manifest.is_file():
    print(f"CRC manifest not found: {manifest}", file=sys.stderr)
    raise SystemExit(2)

entries = []
for number, raw_line in enumerate(manifest.read_text(encoding="utf-8").splitlines(), 1):
    line = raw_line.strip()
    if not line or line.startswith("#"):
        continue
    match = re.fullmatch(r"([0-9A-Fa-f]{8})\s+(.+)", line)
    if not match:
        print(f"Invalid manifest line {number}: {raw_line}", file=sys.stderr)
        raise SystemExit(2)
    entries.append((match.group(1).upper(), match.group(2)))

passed = missing = incorrect = 0
for expected, relative in entries:
    path = manifest.parent / relative
    if not path.is_file():
        print(f"[MISSING] {relative}")
        missing += 1
        continue

    crc = 0
    with path.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            crc = zlib.crc32(chunk, crc)
    actual = f"{crc & 0xFFFFFFFF:08X}"

    if actual == expected:
        print(f"[OK]      {relative}  {actual}")
        passed += 1
    else:
        print(f"[BAD]     {relative}  expected {expected}, got {actual}")
        incorrect += 1

print()
print(f"CRC32 result: {passed} passed, {missing} missing, {incorrect} incorrect.")
raise SystemExit(1 if missing or incorrect else 0)
PY

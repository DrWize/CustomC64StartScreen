#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
vice_url="https://github.com/VICE-Team/svn-mirror/releases/download/3.10.0/SDL2VICE-3.10-win64.zip"
zimmers_base="https://www.zimmers.net/anonftp/pub/cbm/firmware/computers/c64"
dolphindos2_base="https://raw.githubusercontent.com/donnchawp/DolphinDOS2/1.3/rom"
vice_target="${script_dir}/official-vice-3.10-c64"
localized_target="${script_dir}/official-swedish-c64"
dolphindos2_target="${script_dir}/dolphindos2-github-1.3"
temp_dir="$(mktemp -d)"
trap 'rm -rf -- "$temp_dir"' EXIT

for command_name in curl unzip python3; do
    if ! command -v "$command_name" >/dev/null 2>&1; then
        echo "Error: $command_name is required." >&2
        exit 2
    fi
done

vice_files=(
    kernal-901227-01.bin
    kernal-901227-02.bin
    kernal-901227-03.bin
    kernal-906145-02.bin
    kernal-251104-04.bin
    kernal-390852-01.bin
    kernal-901246-01.bin
    chargen-901225-01.bin
    chargen-906143-02.bin
)

localized_files=(
    kernal.325017.swedish-02.bin
    kernal.901227-03-DK.bin
    kernal.swedish-03.C2D007.bin
    characters.325018-02.bin
    characters.325018-02.C2G007.bin
    characters.901225-01-DK.bin
)

mkdir -p -- "$vice_target" "$localized_target" "$dolphindos2_target"

echo "Downloading official VICE 3.10 ROM package..."
curl --fail --location --retry 3 --output "$temp_dir/vice.zip" "$vice_url"
unzip -q "$temp_dir/vice.zip" -d "$temp_dir/vice"
for name in "${vice_files[@]}"; do
    cp -- "$temp_dir/vice/SDL2VICE-3.10-win64/C64/$name" "$vice_target/$name"
done

echo "Downloading Swedish and Danish ROM pairs..."
for name in "${localized_files[@]}"; do
    curl --fail --location --retry 3 --output "$localized_target/$name" "$zimmers_base/$name"
done

echo "Downloading donnchawp/DolphinDOS2 release 1.3..."
for name in dd2_kernal.rom dd2_1541.rom; do
    curl --fail --location --retry 3 --output "$dolphindos2_target/$name" "$dolphindos2_base/$name"
done

"$script_dir/verify-rom-crc.sh"

#!/usr/bin/env bash
# Download C64 chargen font ROMs from patrickmollohan/c64-fonts
# Usage: ./download-fonts.sh

set -e

FONTS_DIR="$(dirname "$0")/fonts"
BASE_URL="https://raw.githubusercontent.com/patrickmollohan/c64-fonts/master"

ORIGINAL_FONTS="c64 c64_swedish c64_swedish2"
CUSTOM_FONTS="aniron apple_ii aurebesh comic_sans hachicro kauno kirby_forgotten_land minecraft zx_spectrum"

mkdir -p "$FONTS_DIR"

echo "Downloading fonts to $FONTS_DIR ..."

for f in $ORIGINAL_FONTS; do
    echo "  $f.bin"
    curl -sfL -o "$FONTS_DIR/$f.bin" "$BASE_URL/original/$f.bin"
done

for f in $CUSTOM_FONTS; do
    echo "  $f.bin"
    curl -sfL -o "$FONTS_DIR/$f.bin" "$BASE_URL/custom/$f.bin"
done

echo "Done — $(ls "$FONTS_DIR"/*.bin 2>/dev/null | wc -l | tr -d ' ') font(s) in $FONTS_DIR"

#!/usr/bin/env bash
# Download all optional local dependencies used by the project.
# Usage: ./download-dependencies.sh [--force] [--skip-fonts] [--skip-roms] [--skip-vice]

set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
force=0
skip_fonts=0
skip_roms=0
skip_vice=0

for arg in "$@"; do
    case "$arg" in
        --force) force=1 ;;
        --skip-fonts) skip_fonts=1 ;;
        --skip-roms) skip_roms=1 ;;
        --skip-vice) skip_vice=1 ;;
        *)
            echo "Unknown argument: $arg" >&2
            echo "Usage: ./download-dependencies.sh [--force] [--skip-fonts] [--skip-roms] [--skip-vice]" >&2
            exit 2
            ;;
    esac
done

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Error: $1 is required." >&2
        exit 1
    fi
}

verify_sha256() {
    file="$1"
    expected="$2"

    if command -v sha256sum >/dev/null 2>&1; then
        actual="$(sha256sum "$file" | awk '{print toupper($1)}')"
    elif command -v shasum >/dev/null 2>&1; then
        actual="$(shasum -a 256 "$file" | awk '{print toupper($1)}')"
    else
        echo "Error: sha256sum or shasum is required to verify VICE." >&2
        exit 1
    fi

    if [ "$actual" != "$expected" ]; then
        echo "Error: VICE ZIP SHA-256 mismatch. Expected $expected, got $actual." >&2
        exit 1
    fi
}

vice_dir_name="SDL2VICE-3.10-win64"
vice_url="https://github.com/VICE-Team/svn-mirror/releases/download/3.10.0/${vice_dir_name}.zip"
vice_sha256="DFA7E0223EA1357BAE988B5C88B332C3B8F80DC3C7A2B51233F50BAB5263DCA5"
vice_target="${script_dir}/vice/${vice_dir_name}"

if [ "$skip_fonts" -eq 0 ]; then
    echo
    echo "== Downloading optional font ROMs =="
    "${script_dir}/download-fonts.sh"
fi

if [ "$skip_roms" -eq 0 ]; then
    echo
    echo "== Downloading and verifying KERNAL/chargen ROMs =="
    "${script_dir}/kernal/download-roms.sh"
fi

if [ "$skip_vice" -eq 0 ]; then
    echo
    echo "== Downloading VICE 3.10 emulator =="
    require_command curl
    require_command unzip

    if [ -f "${vice_target}/x64sc.exe" ] && [ "$force" -eq 0 ]; then
        echo "VICE already exists at ${vice_target}"
        echo "Use --force to download and replace it."
    else
        temp_dir="$(mktemp -d)"
        trap 'rm -rf "$temp_dir"' EXIT

        curl --fail --location --retry 3 --output "${temp_dir}/${vice_dir_name}.zip" "$vice_url"
        verify_sha256 "${temp_dir}/${vice_dir_name}.zip" "$vice_sha256"
        unzip -q "${temp_dir}/${vice_dir_name}.zip" -d "$temp_dir"

        if [ ! -f "${temp_dir}/${vice_dir_name}/x64sc.exe" ]; then
            echo "Error: downloaded VICE archive did not contain ${vice_dir_name}/x64sc.exe." >&2
            exit 1
        fi

        mkdir -p "${script_dir}/vice"
        rm -rf "$vice_target"
        mv "${temp_dir}/${vice_dir_name}" "$vice_target"
        echo "VICE installed to ${vice_target}"
    fi
fi

echo
echo "Dependency download complete."


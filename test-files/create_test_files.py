#!/usr/bin/env python3
"""
Create test PRG and SEQ files for Kaleidoscope compatibility testing
with C64 Boot Screen Editor.

Run: python create_test_files.py
"""

import struct

# C64 Constants
SCREEN_SIZE = 1000
CHAR_SPACE = 32   # Space character
CHAR_STAR = 42    # *

# Colors (C64 palette indices)
COLOR_LIGHT_BLUE = 14  # Light blue text
COLOR_WHITE = 1        # White


def create_screen_data():
    """Create a simple test screen with minimal unique characters"""
    screen = bytearray(SCREEN_SIZE)
    color = bytearray(SCREEN_SIZE)
    
    # Fill with spaces and default color
    screen[:] = [CHAR_SPACE] * SCREEN_SIZE
    color[:] = [COLOR_LIGHT_BLUE] * SCREEN_SIZE
    
    # Row 0: Top border
    for col in range(40):
        idx = 0 * 40 + col
        screen[idx] = CHAR_STAR  # *
        color[idx] = COLOR_WHITE
    
    # Row 2: "C64 BOOT TEST"
    text = "  C64 BOOT TEST  "
    for col, char in enumerate(text[:40]):
        idx = 2 * 40 + col
        screen[idx] = ord(char)
        color[idx] = COLOR_WHITE
    
    # Row 4: "BY KALEIDOSCOPE"
    text2 = "  BY KALEIDOSCOPE  "
    for col, char in enumerate(text2[:40]):
        idx = 4 * 40 + col
        screen[idx] = ord(char)
        color[idx] = COLOR_WHITE
    
    # Row 23: Bottom border
    for col in range(40):
        idx = 23 * 40 + col
        screen[idx] = CHAR_STAR  # *
        color[idx] = COLOR_WHITE
    
    return screen, color


def create_prg_file(screen, color, filename):
    """Create PRG file with load address $0400"""
    load_addr = 0x0400
    
    # PRG format: [load_addr_low, load_addr_high, screen_data..., color_data...]
    prg_data = struct.pack('<H', load_addr)  # Little-endian: low byte, high byte
    prg_data += bytes(screen)
    prg_data += bytes(color)
    
    with open(filename, 'wb') as f:
        f.write(prg_data)
    
    print(f"Created {filename}")
    print(f"   Size: {len(prg_data)} bytes")
    print(f"   Load address: ${load_addr:04X}")
    print(f"   Format: PRG (Screen RAM + Color RAM)")
    
    return filename


def create_seq_file(screen, color, filename, include_color=True):
    """Create SEQ file"""
    if include_color:
        seq_data = bytes(screen) + bytes(color)
        description = "Screen RAM + Color RAM"
    else:
        seq_data = bytes(screen)
        description = "Screen RAM only"
    
    with open(filename, 'wb') as f:
        f.write(seq_data)
    
    print(f"Created {filename}")
    print(f"   Size: {len(seq_data)} bytes")
    print(f"   Format: SEQ ({description})")
    
    return filename


def main():
    print("=" * 60)
    print("Creating Test Files for Kaleidoscope <-> C64 Boot Screen Editor")
    print("=" * 60)
    print()
    
    # Create the screen data
    screen, color = create_screen_data()
    
    print("Design Details:")
    print("   Size: 40x25 = 1000 characters")
    print("   Characters: Spaces, asterisks (*), and text letters")
    print("   Colors: Light blue background, white text")
    print("   Unique chars: ~15 (very compressible)")
    print("   Unique colors: 2 (excellent for RLE compression)")
    print()
    
    # Create PRG file
    print("Creating PRG File...")
    create_prg_file(screen, color, 'kaleidoscope-test.prg')
    print()
    
    # Create SEQ files
    print("Creating SEQ Files...")
    create_seq_file(screen, color, 'kaleidoscope-test.seq', include_color=True)
    print()
    create_seq_file(screen, bytearray(SCREEN_SIZE), 'kaleidoscope-test-screen-only.seq', include_color=False)
    print()
    
    print("=" * 60)
    print("All test files created successfully!")
    print("=" * 60)
    print()
    print("TEST INSTRUCTIONS:")
    print()
    print("1. PRG File Test:")
    print("   - In Kaleidoscope: Load 'kaleidoscope-test.prg'")
    print("   - In C64 Boot Screen Editor: Import PRG file")
    print("   - Verify: Borders and text appear correctly")
    print()
    print("2. SEQ File Test:")
    print("   - In C64 Boot Screen Editor: Import 'kaleidoscope-test.seq'")
    print("   - Verify: All characters and colors load")
    print()
    print("3. ROM Patching Test:")
    print("   - Upload KERNAL ROM")
    print("   - Import design from file")
    print("   - Create extended patch")
    print("   - Test in VICE emulator")
    print()
    print("EXPECTED RESULTS:")
    print("   - Design should display perfectly")
    print("   - Should compress under 300 bytes (fits in 514-byte limit)")
    print("   - No errors during import or patching")
    print()
    print("File sizes:")
    print("   - PRG: 2002 bytes (2 byte header + 1000 screen + 1000 color)")
    print("   - SEQ: 2000 bytes (1000 screen + 1000 color)")
    print("   - Compressed: ~150-200 bytes (RLE compression)")
    print()


if __name__ == '__main__':
    main()
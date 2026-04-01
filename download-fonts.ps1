# Download C64 chargen font ROMs from patrickmollohan/c64-fonts
# Usage: .\download-fonts.ps1

$ErrorActionPreference = "Stop"

$fontsDir = Join-Path $PSScriptRoot "fonts"
$baseUrl = "https://raw.githubusercontent.com/patrickmollohan/c64-fonts/master"

$originalFonts = @("c64", "c64_swedish", "c64_swedish2")
$customFonts = @("aniron", "apple_ii", "aurebesh", "comic_sans", "hachicro", "kauno", "kirby_forgotten_land", "minecraft", "zx_spectrum")

if (-not (Test-Path $fontsDir)) {
    New-Item -ItemType Directory -Path $fontsDir | Out-Null
}

Write-Host "Downloading fonts to $fontsDir ..."

foreach ($f in $originalFonts) {
    Write-Host "  $f.bin"
    Invoke-WebRequest -Uri "$baseUrl/original/$f.bin" -OutFile (Join-Path $fontsDir "$f.bin")
}

foreach ($f in $customFonts) {
    Write-Host "  $f.bin"
    Invoke-WebRequest -Uri "$baseUrl/custom/$f.bin" -OutFile (Join-Path $fontsDir "$f.bin")
}

$count = (Get-ChildItem -Path $fontsDir -Filter "*.bin").Count
Write-Host "Done - $count font(s) in $fontsDir"

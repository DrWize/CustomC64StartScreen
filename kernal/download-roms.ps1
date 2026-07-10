[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$viceUrl = 'https://github.com/VICE-Team/svn-mirror/releases/download/3.10.0/SDL2VICE-3.10-win64.zip'
$zimmersBase = 'https://www.zimmers.net/anonftp/pub/cbm/firmware/computers/c64'
$dolphinDos2Base = 'https://raw.githubusercontent.com/donnchawp/DolphinDOS2/1.3/rom'
$viceTarget = Join-Path $PSScriptRoot 'official-vice-3.10-c64'
$localizedTarget = Join-Path $PSScriptRoot 'official-swedish-c64'
$dolphinDos2Target = Join-Path $PSScriptRoot 'dolphindos2-github-1.3'
$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ('c64-rom-download-' + [guid]::NewGuid().ToString('N'))
$zipPath = Join-Path $tempRoot 'SDL2VICE-3.10-win64.zip'
$extractPath = Join-Path $tempRoot 'vice'

$viceFiles = @(
    'kernal-901227-01.bin',
    'kernal-901227-02.bin',
    'kernal-901227-03.bin',
    'kernal-906145-02.bin',
    'kernal-251104-04.bin',
    'kernal-390852-01.bin',
    'kernal-901246-01.bin',
    'chargen-901225-01.bin',
    'chargen-906143-02.bin'
)

$localizedFiles = @(
    'kernal.325017.swedish-02.bin',
    'kernal.901227-03-DK.bin',
    'kernal.swedish-03.C2D007.bin',
    'characters.325018-02.bin',
    'characters.325018-02.C2G007.bin',
    'characters.901225-01-DK.bin'
)

try {
    New-Item -ItemType Directory -Path $tempRoot, $viceTarget, $localizedTarget, $dolphinDos2Target -Force | Out-Null

    Write-Host 'Downloading official VICE 3.10 ROM package...'
    Invoke-WebRequest -Uri $viceUrl -OutFile $zipPath -UseBasicParsing
    $signature = [IO.File]::ReadAllBytes($zipPath)[0..1]
    if ($signature[0] -ne 0x50 -or $signature[1] -ne 0x4B) {
        throw 'VICE download is not a valid ZIP file.'
    }

    Expand-Archive -LiteralPath $zipPath -DestinationPath $extractPath
    $c64Source = Join-Path $extractPath 'SDL2VICE-3.10-win64\C64'
    foreach ($name in $viceFiles) {
        Copy-Item -LiteralPath (Join-Path $c64Source $name) -Destination (Join-Path $viceTarget $name) -Force
    }

    Write-Host 'Downloading Swedish and Danish ROM pairs...'
    foreach ($name in $localizedFiles) {
        Invoke-WebRequest -Uri "$zimmersBase/$name" -OutFile (Join-Path $localizedTarget $name) -UseBasicParsing
    }

    Write-Host 'Downloading donnchawp/DolphinDOS2 release 1.3...'
    foreach ($name in @('dd2_kernal.rom', 'dd2_1541.rom')) {
        Invoke-WebRequest -Uri "$dolphinDos2Base/$name" -OutFile (Join-Path $dolphinDos2Target $name) -UseBasicParsing
    }

    & (Join-Path $PSScriptRoot 'verify-rom-crc.ps1')
    if ($LASTEXITCODE -ne 0) {
        throw 'One or more downloaded ROM files failed CRC verification.'
    }
} finally {
    if (Test-Path -LiteralPath $tempRoot) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force
    }
}

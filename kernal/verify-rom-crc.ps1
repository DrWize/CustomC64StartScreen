[CmdletBinding()]
param(
    [string]$Manifest
)

$ErrorActionPreference = 'Stop'

if (-not $Manifest) {
    $Manifest = Join-Path $PSScriptRoot 'roms.crc32'
}

function Get-Crc32 {
    param([Parameter(Mandatory)][string]$LiteralPath)

    $crc = [uint32]::MaxValue
    $polynomial = [Convert]::ToUInt32('EDB88320', 16)
    $stream = [IO.File]::OpenRead($LiteralPath)
    try {
        while (($value = $stream.ReadByte()) -ne -1) {
            $crc = $crc -bxor [uint32]$value
            for ($bit = 0; $bit -lt 8; $bit++) {
                if (($crc -band 1) -ne 0) {
                    $crc = [uint32](($crc -shr 1) -bxor $polynomial)
                } else {
                    $crc = [uint32]($crc -shr 1)
                }
            }
        }
    } finally {
        $stream.Dispose()
    }

    return '{0:X8}' -f [uint32]($crc -bxor [uint32]::MaxValue)
}

if (-not (Test-Path -LiteralPath $Manifest -PathType Leaf)) {
    Write-Error "CRC manifest not found: $Manifest"
    exit 2
}

$baseDirectory = Split-Path -Parent (Resolve-Path -LiteralPath $Manifest)
$entries = foreach ($line in Get-Content -LiteralPath $Manifest) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) {
        continue
    }
    if ($trimmed -notmatch '^([0-9A-Fa-f]{8})\s+(.+)$') {
        Write-Error "Invalid manifest line: $line"
        exit 2
    }
    [pscustomobject]@{
        Expected = $Matches[1].ToUpperInvariant()
        Relative = $Matches[2]
    }
}

$passed = 0
$missing = 0
$failed = 0

foreach ($entry in $entries) {
    $path = Join-Path $baseDirectory ($entry.Relative -replace '/', [IO.Path]::DirectorySeparatorChar)
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        Write-Host "[MISSING] $($entry.Relative)" -ForegroundColor Yellow
        $missing++
        continue
    }

    $actual = Get-Crc32 -LiteralPath $path
    if ($actual -eq $entry.Expected) {
        Write-Host "[OK]      $($entry.Relative)  $actual" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "[BAD]     $($entry.Relative)  expected $($entry.Expected), got $actual" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "CRC32 result: $passed passed, $missing missing, $failed incorrect."

if ($missing -gt 0 -or $failed -gt 0) {
    exit 1
}
exit 0

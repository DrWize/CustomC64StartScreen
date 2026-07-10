# Download all optional local dependencies used by the project.
# Usage: .\download-dependencies.ps1 [-Force] [-SkipFonts] [-SkipRoms] [-SkipVice]

param(
    [switch]$Force,
    [switch]$SkipFonts,
    [switch]$SkipRoms,
    [switch]$SkipVice
)

$ErrorActionPreference = 'Stop'

$viceVersion = '3.10'
$viceDirName = 'SDL2VICE-3.10-win64'
$viceUrl = "https://github.com/VICE-Team/svn-mirror/releases/download/3.10.0/$viceDirName.zip"
$viceSha256 = 'DFA7E0223EA1357BAE988B5C88B332C3B8F80DC3C7A2B51233F50BAB5263DCA5'
$viceTarget = Join-Path $PSScriptRoot "vice\$viceDirName"

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Action
    )

    Write-Host ""
    Write-Host "== $Name =="
    & $Action
}

if (-not $SkipFonts) {
    Invoke-Step 'Downloading optional font ROMs' {
        & (Join-Path $PSScriptRoot 'download-fonts.ps1')
    }
}

if (-not $SkipRoms) {
    Invoke-Step 'Downloading and verifying KERNAL/chargen ROMs' {
        & (Join-Path $PSScriptRoot 'kernal\download-roms.ps1')
    }
}

if (-not $SkipVice) {
    Invoke-Step "Downloading VICE $viceVersion emulator" {
        $viceExe = Join-Path $viceTarget 'x64sc.exe'
        if ((Test-Path $viceExe) -and -not $Force) {
            Write-Host "VICE already exists at $viceTarget"
            Write-Host 'Use -Force to download and replace it.'
            return
        }

        $tempRoot = Join-Path ([IO.Path]::GetTempPath()) ('c64boot-dependencies-' + [guid]::NewGuid().ToString('N'))
        $zipPath = Join-Path $tempRoot "$viceDirName.zip"
        $extractPath = Join-Path $tempRoot 'extract'

        try {
            New-Item -ItemType Directory -Path $tempRoot, $extractPath -Force | Out-Null

            Write-Host "Downloading $viceUrl"
            Invoke-WebRequest -Uri $viceUrl -OutFile $zipPath

            $actualSha256 = (Get-FileHash -Algorithm SHA256 -Path $zipPath).Hash.ToUpperInvariant()
            if ($actualSha256 -ne $viceSha256) {
                throw "VICE ZIP SHA-256 mismatch. Expected $viceSha256, got $actualSha256."
            }

            Expand-Archive -LiteralPath $zipPath -DestinationPath $extractPath -Force

            $extractedDir = Join-Path $extractPath $viceDirName
            if (-not (Test-Path (Join-Path $extractedDir 'x64sc.exe'))) {
                throw "Downloaded VICE archive did not contain $viceDirName\x64sc.exe."
            }

            $viceRoot = Join-Path $PSScriptRoot 'vice'
            if (-not (Test-Path $viceRoot)) {
                New-Item -ItemType Directory -Path $viceRoot | Out-Null
            }
            if (Test-Path $viceTarget) {
                Remove-Item -LiteralPath $viceTarget -Recurse -Force
            }
            Move-Item -LiteralPath $extractedDir -Destination $viceTarget
            Write-Host "VICE installed to $viceTarget"
        } finally {
            if (Test-Path $tempRoot) {
                Remove-Item -LiteralPath $tempRoot -Recurse -Force
            }
        }
    }
}

Write-Host ""
Write-Host 'Dependency download complete.'


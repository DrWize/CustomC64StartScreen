# Start C64 Boot Screen Editor with Docker
# Usage: .\start-server-docker.ps1 [port]
#
# Requires: Docker Desktop installed and running
#
# This is the recommended way to run the editor, as it provides
# consistent behavior across all platforms and enables the font
# library to scan the fonts/ directory.

param([int]$Port = 8064)

# Check if Docker is available
try {
    $dockerInfo = docker info 2>$null
    if (-not $dockerInfo) {
        throw "Docker daemon not responding"
    }
} catch {
    Write-Host "Error: Docker is not installed or not running"
    Write-Host "Install Docker Desktop from https://www.docker.com/"
    exit 1
}

Write-Host "C64 Boot Screen Editor - Docker"
Write-Host "================================"
Write-Host ""
Write-Host "Building image..."

# Build the Docker image
try {
    docker build -t c64boot-editor . -q
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build Docker image"
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    exit 1
}

Write-Host "Starting container on port $Port..."
Write-Host "Open http://localhost:$Port in your browser"
Write-Host "Press Ctrl+C to stop"
Write-Host ""

# Run with volume mounts for fonts and kernal directories
$fontsPath = Join-Path $PSScriptRoot "fonts"
$kernalPath = Join-Path $PSScriptRoot "kernal"

# Ensure directories exist
if (-not (Test-Path $fontsPath)) { New-Item -ItemType Directory -Path $fontsPath | Out-Null }
if (-not (Test-Path $kernalPath)) { New-Item -ItemType Directory -Path $kernalPath | Out-Null }

docker run --rm -it `
    -p "$Port:8064" `
    -v "$fontsPath:/usr/local/apache2/htdocs/fonts:ro" `
    -v "$kernalPath:/usr/local/apache2/htdocs/kernal:ro" `
    --name c64boot-editor `
    c64boot-editor

# Start a local web server for C64 Boot Screen Editor
# Usage: .\serve.ps1 [port]

param([int]$Port = 8064)

Write-Host "C64 Boot Screen Editor"
Write-Host "Open http://localhost:$Port"
Write-Host "Press Ctrl+C to stop"
Write-Host ""

python -m http.server $Port --directory $PSScriptRoot

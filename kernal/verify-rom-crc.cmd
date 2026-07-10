@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0verify-rom-crc.ps1"
exit /b %ERRORLEVEL%

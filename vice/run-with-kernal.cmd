@echo off
setlocal

set "VICE_HOME=%~dp0SDL2VICE-3.10-win64"
set "VICE_EXE=%VICE_HOME%\x64sc.exe"

if "%~1"=="" (
    echo Usage: %~nx0 path\to\patched-kernal.bin
    exit /b 2
)

if not exist "%VICE_EXE%" (
    echo VICE was not found at "%VICE_EXE%".
    exit /b 3
)

for %%I in ("%~1") do (
    set "KERNAL=%%~fI"
    set "KERNAL_SIZE=%%~zI"
)

if not exist "%KERNAL%" (
    echo KERNAL file was not found: "%KERNAL%"
    exit /b 4
)

if not "%KERNAL_SIZE%"=="8192" (
    echo Invalid KERNAL size: %KERNAL_SIZE% bytes. Expected 8192.
    exit /b 5
)

echo Starting VICE with KERNAL: "%KERNAL%"
start "" "%VICE_EXE%" -kernal "%KERNAL%"
exit /b 0

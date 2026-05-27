@echo off
rem FinanceChecker double-click launcher for Windows.
rem Ensures Node, then runs the production launch flow and opens the browser.

pushd "%~dp0"

powershell -ExecutionPolicy Bypass -File "setup.ps1" -Launch

if errorlevel 1 (
    echo.
    echo FinanceChecker failed to start. Read the message above.
    pause
)

popd

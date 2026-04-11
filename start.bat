@echo off
:: Thin wrapper — delegates to start.js to avoid Smart App Control blocks.
:: You can also run:  node start.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed.
    echo  Please install Node.js 20+ from https://nodejs.org/
    pause
    exit /b 1
)
node "%~dp0start.js" %*

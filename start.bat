@echo off
title ForgeOS - Starting...
setlocal enabledelayedexpansion

echo.
echo  ============================================
echo    ForgeOS - AI-Native Product Execution App
echo  ============================================
echo.

:: ── Check Node.js ──────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed.
    echo.
    echo  Please install Node.js 20+ from:
    echo    https://nodejs.org/
    echo.
    echo  Or run:  winget install OpenJS.NodeJS.LTS
    echo.
    pause
    exit /b 1
)

:: Check Node.js version >= 20
for /f "tokens=1 delims=v." %%a in ('node -v') do set NODE_MAJOR=%%a
for /f "tokens=1 delims=." %%a in ('node -v') do set NODE_VER=%%a
set NODE_VER=%NODE_VER:v=%
if %NODE_VER% lss 20 (
    echo  [ERROR] Node.js 20+ required. Found:
    node -v
    echo.
    echo  Please update from https://nodejs.org/
    pause
    exit /b 1
)
echo  [OK] Node.js found

:: ── Check/Install pnpm ─────────────────────────────────────────
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo  [..] Installing pnpm...
    call npm install -g pnpm >nul 2>&1
    where pnpm >nul 2>&1
    if %errorlevel% neq 0 (
        echo  [ERROR] Failed to install pnpm.
        echo  Please run:  npm install -g pnpm
        pause
        exit /b 1
    )
)
echo  [OK] pnpm found

:: ── Install dependencies (first run) ───────────────────────────
if not exist "node_modules\" (
    echo.
    echo  [..] First run - installing dependencies...
    echo      This may take a few minutes.
    echo.
    call pnpm install
    if %errorlevel% neq 0 (
        echo  [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
    echo  [OK] Dependencies installed
) else (
    echo  [OK] Dependencies already installed
)

:: ── Build Next.js (first run or after changes) ─────────────────
if not exist ".next\standalone\server.js" (
    echo.
    echo  [..] Building ForgeOS...
    echo      This may take a minute.
    echo.
    call pnpm build
    if %errorlevel% neq 0 (
        echo  [ERROR] Build failed.
        pause
        exit /b 1
    )
    echo  [OK] Build complete
) else (
    echo  [OK] Build already exists
)

:: ── Compile Electron (first run) ────────────────────────────────
if not exist "electron\dist\main.js" (
    echo  [..] Compiling desktop app...
    call npx tsc -p electron\tsconfig.json
    if %errorlevel% neq 0 (
        echo  [ERROR] Electron compilation failed.
        pause
        exit /b 1
    )
    echo  [OK] Desktop app compiled
) else (
    echo  [OK] Desktop app already compiled
)

:: ── Launch ──────────────────────────────────────────────────────
echo.
echo  ============================================
echo    Launching ForgeOS...
echo  ============================================
echo.
echo  Login: founder@forgeos.dev / forgeos123
echo.

call npx electron electron\dist\main.js

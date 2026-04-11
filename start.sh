#!/usr/bin/env bash
set -e

echo ""
echo "  ============================================"
echo "    ForgeOS - AI-Native Product Execution App"
echo "  ============================================"
echo ""

cd "$(dirname "$0")"

# ── Check Node.js ──────────────────────────────────────────────
if ! command -v node &> /dev/null; then
    echo "  [ERROR] Node.js is not installed."
    echo ""
    echo "  Install Node.js 20+ from: https://nodejs.org/"
    echo ""
    echo "  Or use your package manager:"
    echo "    macOS:   brew install node"
    echo "    Ubuntu:  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs"
    echo ""
    exit 1
fi

NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 20 ]; then
    echo "  [ERROR] Node.js 20+ required. Found: $(node -v)"
    echo "  Please update from https://nodejs.org/"
    exit 1
fi
echo "  [OK] Node.js $(node -v) found"

# ── Check/Install pnpm ─────────────────────────────────────────
if ! command -v pnpm &> /dev/null; then
    echo "  [..] Installing pnpm..."
    npm install -g pnpm 2>/dev/null || {
        echo "  [ERROR] Failed to install pnpm. Run: npm install -g pnpm"
        exit 1
    }
fi
echo "  [OK] pnpm found"

# ── Install dependencies (first run) ───────────────────────────
if [ ! -d "node_modules" ]; then
    echo ""
    echo "  [..] First run — installing dependencies..."
    echo "       This may take a few minutes."
    echo ""
    pnpm install
    echo "  [OK] Dependencies installed"
else
    echo "  [OK] Dependencies already installed"
fi

# ── Build Next.js (first run or after changes) ─────────────────
if [ ! -f ".next/standalone/server.js" ]; then
    echo ""
    echo "  [..] Building ForgeOS..."
    echo "       This may take a minute."
    echo ""
    pnpm build
    echo "  [OK] Build complete"
else
    echo "  [OK] Build already exists"
fi

# ── Compile Electron (first run) ────────────────────────────────
if [ ! -f "electron/dist/main.js" ]; then
    echo "  [..] Compiling desktop app..."
    npx tsc -p electron/tsconfig.json
    echo "  [OK] Desktop app compiled"
else
    echo "  [OK] Desktop app already compiled"
fi

# ── Launch ──────────────────────────────────────────────────────
echo ""
echo "  ============================================"
echo "    Launching ForgeOS..."
echo "  ============================================"
echo ""
echo "  Login: founder@forgeos.dev / forgeos123"
echo ""

npx electron electron/dist/main.js

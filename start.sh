#!/usr/bin/env bash
# Thin wrapper — delegates to start.js for cross-platform consistency.
# You can also run:  node start.js
set -e
cd "$(dirname "$0")"

if ! command -v node &> /dev/null; then
    echo "  [ERROR] Node.js is not installed."
    echo "  Install Node.js 20+ from: https://nodejs.org/"
    exit 1
fi

exec node start.js "$@"

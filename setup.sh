#!/usr/bin/env bash
set -e

echo ""
echo "  ⚡ ForgeOS Installer"
echo "  ===================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}!${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; exit 1; }

# 1. Check Node.js
if ! command -v node &> /dev/null; then
  fail "Node.js is required (v20+). Install from https://nodejs.org"
fi
NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  fail "Node.js 20+ required (found v$(node -v))"
fi
ok "Node.js $(node -v)"

# 2. Check pnpm
if ! command -v pnpm &> /dev/null; then
  warn "pnpm not found. Installing..."
  npm install -g pnpm
fi
ok "pnpm $(pnpm -v)"

# 3. Check PostgreSQL
if ! command -v psql &> /dev/null; then
  fail "PostgreSQL is required. Install from https://postgresql.org or use 'docker-compose up db'"
fi
ok "PostgreSQL (psql found)"

# 4. Create .env if it doesn't exist
if [ ! -f .env ]; then
  echo ""
  echo "  Creating .env from .env.example..."
  cp .env.example .env

  # Generate AUTH_SECRET
  if command -v openssl &> /dev/null; then
    AUTH_SECRET=$(openssl rand -base64 32)
    sed -i "s|AUTH_SECRET=.*|AUTH_SECRET=\"$AUTH_SECRET\"|" .env
    ok "Generated AUTH_SECRET"
  else
    warn "openssl not found — please set AUTH_SECRET in .env manually"
  fi
  ok "Created .env"
else
  ok ".env already exists"
fi

# 5. Install dependencies
echo ""
echo "  Installing dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
ok "Dependencies installed"

# 6. Generate Prisma client
pnpm dlx prisma generate
ok "Prisma client generated"

# 7. Create database if it doesn't exist
DB_NAME=$(grep DATABASE_URL .env | sed 's/.*\/\([^?]*\).*/\1/')
if [ -z "$DB_NAME" ]; then
  DB_NAME="forgeos_dev"
fi

if command -v createdb &> /dev/null; then
  createdb "$DB_NAME" 2>/dev/null && ok "Database '$DB_NAME' created" || ok "Database '$DB_NAME' already exists"
fi

# 8. Run migrations
echo ""
echo "  Running database migrations..."
pnpm dlx prisma migrate dev --skip-generate 2>/dev/null || pnpm dlx prisma migrate dev
ok "Migrations applied"

# 9. Seed data
echo ""
echo "  Seeding sample data..."
pnpm dlx prisma db seed 2>/dev/null && ok "Database seeded" || warn "Seeding skipped (may already have data)"

# Done!
echo ""
echo -e "  ${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  ${GREEN}⚡ ForgeOS is ready!${NC}"
echo ""
echo "  Start the dev server:"
echo "    pnpm dev"
echo ""
echo "  Then open:"
echo "    http://localhost:3000"
echo ""
echo "  Demo login:"
echo "    Email:    founder@forgeos.dev"
echo "    Password: forgeos123"
echo ""
echo -e "  ${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

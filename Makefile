.PHONY: setup dev build test lint seed reset-db studio clean

# Quick start
setup:
	./setup.sh

dev:
	pnpm dev

build:
	pnpm build

test:
	pnpm test

lint:
	pnpm lint

# Database
seed:
	pnpm dlx prisma db seed

db-migrate:
	pnpm dlx prisma migrate dev

db-studio:
	pnpm dlx prisma studio

db-reset:
	pnpm dlx prisma migrate reset --force

# Cleanup
clean:
	rm -rf .next node_modules

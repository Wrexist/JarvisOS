@AGENTS.md

# ForgeOS Project Rules

## Product
ForgeOS is an AI-native product execution app for ideas, projects, tasks, docs, GitHub pull requests, and Claude coding handoffs.

## Stack
- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL
- Tailwind
- shadcn/ui

## Engineering rules
- Prefer clarity over cleverness
- Use strict TypeScript
- Keep route handlers thin
- Put business logic in services or lib helpers
- Avoid giant files and giant components
- Reuse patterns before adding new ones
- Do not create speculative abstractions unless justified
- Do not hallucinate files or APIs
- Inspect existing files before making edits

## UI rules
- Premium dark UI
- Clear hierarchy
- Minimal clutter
- Rounded panels
- Strong spacing
- Every page should help the user decide what matters now

## Data rules
- Prisma schema is source of truth
- Enums must be used consistently
- Major actions should create ActivityEvent records

## Product priorities
1. Ideas flow
2. Project workspace
3. Tasks
4. Docs/spec generation
5. Dashboard
6. GitHub integration
7. Claude handoff

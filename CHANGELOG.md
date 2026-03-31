# Changelog

## v8.0 — Advanced Features & Quality Gate

- Advanced search with filter syntax (status:blocked, priority:high, project:name)
- Idea comparison view (side-by-side, score visualization)
- Project templates (save structure, create from template)
- Outgoing webhooks (HMAC signed, delivery tracking)
- E2E tests with Playwright
- Search now covers descriptions and summaries

## v7.0 — Intelligence & Automation

- Comments system on tasks and ideas
- Auto-complete tasks when linked PR is merged
- Project timeline view (scheduled vs unscheduled, deadline tracking)
- Schema migration for Comment model

## v6.2 — Audit Fixes

- Rate limiter memory leak fixed
- Session fallback removed (security)
- N+1 query in createManyTasks fixed
- Zod validation on all PATCH routes
- Dead code cleanup

## v6.0 — Professional Installer & v1.0 Release

- One-command setup script (`./setup.sh`)
- Docker Compose for zero-config deployment
- Professional README with 3 setup methods
- Onboarding checklist for new users
- Project Settings tab (edit name, description, delete)
- CHANGELOG and MIT License

## v5.0 — Polish & Delight

- Toast notifications on every mutation
- Real session user data in sidebar with sign out
- Analytics dashboard (velocity, charts, AI usage)
- Data export (GET /api/export)
- Dark/light theme toggle
- Zod validation enforcement on API routes

## v4.0 — Production-Ready

- NextAuth authentication (credentials + GitHub OAuth)
- Login and registration pages
- Proxy-based route protection
- CI/CD pipeline (GitHub Actions)
- Vitest testing framework (22 tests)
- Structured logging and rate limiting
- Health check endpoint
- Security headers
- Performance database indexes

## v3.0 — Power Features

- Task dependencies (blocked-by relationships)
- In-app notifications with bell icon
- PR summary generation (AI)
- Spec-to-task generation (AI)
- Bulk task operations
- Keyboard shortcuts
- Task deadline badges
- Zod validation schemas

## v2.0 — Intelligence Layer

- AI task breakdown from project descriptions
- Project health scores (0-100)
- Task-to-PR linking
- GitHub webhook PR/check-run processing
- AI-powered next-action engine
- Weekly review page with stale detection
- Global search with Cmd+K command palette
- Mobile responsive sidebar
- Toast notification system (Sonner)

## v1.0 — MVP

- Ideas: CRUD, AI enrichment, convert to project
- Projects: CRUD, stage system, activity feed
- Tasks: CRUD, kanban board, list view, detail drawer
- Docs: Markdown editor, AI spec generation
- Dashboard: Next-best-action, stats, widgets
- Prompt templates: CRUD with 5 defaults
- GitHub: Webhook endpoint, repo connect
- Claude handoff: Task prompt gen, CLAUDE.md generator
- Premium dark UI with frosted glass panels
- Full Prisma schema (12 models, 9 enums)

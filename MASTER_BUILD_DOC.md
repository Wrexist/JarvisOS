# ForgeOS Master Build Doc for Claude Code

## Purpose

This document is the single source of truth for building ForgeOS in sequence with Claude Code.

ForgeOS is an AI-native product execution system for turning ideas into projects, projects into tasks, tasks into code, and code into shipped product through GitHub and Claude workflows.

This doc is written to be pasted into a repo and used as the main build guide.

---

# 1. Product definition

## One-sentence definition

ForgeOS is a founder-grade operating system for managing ideas, projects, specs, tasks, GitHub pull requests, and AI coding handoffs in one clean product.

## Core outcome

At any time, the product should answer:

* What ideas do I have?
* Which ones matter most?
* What is the next step for each project?
* What should I build next?
* What is blocked?
* What has Claude already helped with?
* What PRs are open and what needs action?

## v1 target user

* Solo builder
* Indie hacker
* AI-native developer
* Uses GitHub
* Uses Claude Code heavily
* Wants speed, clarity, and clean product structure

## Product principles

* Action over organization
* Low friction capture
* Clear next step on every screen
* AI is embedded, not bolted on
* GitHub is source of truth for code workflow
* Premium UX without clutter
* Strong architecture without overengineering

---

# 2. Tech stack

## Frontend

* Next.js App Router
* TypeScript
* Tailwind CSS
* shadcn/ui

## Backend

* Next.js route handlers
* Service layer under `src/server/services`

## Data

* Prisma ORM
* PostgreSQL

## Integrations

* Anthropic API for in-app AI generation
* Claude Code for coding workflow
* GitHub App for repo and PR sync

## Supporting patterns

* `CLAUDE.md` for persistent project instructions
* `.claude/hooks.json` for automation hooks
* GitHub Actions for future `@claude` workflows

---

# 3. Core product structure

## Main navigation

* Home
* Ideas
* Projects
* Tasks
* Docs
* GitHub
* AI Runs
* Settings

## Main entities

* User
* Workspace
* Idea
* Project
* Task
* Document
* Repository
* PullRequest
* CheckRun
* AIRun
* PromptTemplate
* ActivityEvent

## Key flows

1. Capture idea
2. Enrich idea with AI
3. Convert idea into project
4. Generate MVP spec
5. Generate tasks
6. Execute tasks
7. Hand tasks to Claude Code
8. Link work to GitHub PRs
9. Track status and improve

---

# 4. Architecture rules

## General rules

* Use strict TypeScript
* Prefer simple and explicit code
* Avoid speculative abstractions
* Use reusable UI primitives
* Keep route handlers thin
* Move business logic into services or lib helpers
* Use server components by default when reasonable
* Keep client state minimal and intentional

## File organization rules

* UI components live in `src/components`
* Shared business logic lives in `src/server/services` or `src/lib`
* API and route handling live in `src/app/api`
* Database access goes through Prisma only
* Never duplicate domain logic in multiple route handlers

## UI rules

* Premium dark aesthetic
* Clean spacing
* Strong hierarchy
* Rounded panels
* Minimal noise
* Every page should help the user decide what to do next

## Data rules

* Prisma schema is source of truth
* All major actions should create an `ActivityEvent`
* Enums should be used consistently
* Keep naming predictable and boring

---

# 5. Required repo structure

```txt
src/
  app/
    (dashboard)/
      page.tsx
      ideas/
      projects/
      tasks/
      docs/
      github/
      ai-runs/
      settings/
    api/
      ai/
        idea-enrich/route.ts
        task-breakdown/route.ts
        spec-generate/route.ts
        next-action/route.ts
      github/
        webhook/route.ts
        sync/route.ts
      ideas/
      projects/
      tasks/
  components/
    layout/
    dashboard/
    ideas/
    projects/
    tasks/
    docs/
    github/
    ai/
    ui/
  lib/
    prisma.ts
    utils.ts
    ai/
      anthropic.ts
      prompts.ts
      parsers.ts
    github/
      app.ts
      auth.ts
      webhook.ts
      sync.ts
  server/
    services/
      idea.service.ts
      project.service.ts
      task.service.ts
      document.service.ts
      ai-run.service.ts
      github-sync.service.ts
prisma/
  schema.prisma
  seed.ts
.claude/
  hooks.json
CLAUDE.md
```

---

# 6. Prisma schema to implement

Use the expanded schema below as the MVP-plus foundation.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum IdeaStatus {
  INBOX
  REVIEWING
  VALIDATED
  CONVERTED
  ARCHIVED
}

enum ProjectStage {
  CLARIFYING
  PLANNING
  READY_TO_BUILD
  BUILDING
  TESTING
  SHIPPED
  PAUSED
  ARCHIVED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  BLOCKED
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum DocumentType {
  PRD
  TECH_SPEC
  NOTES
  RETRO
  SCRATCHPAD
}

enum AIRunType {
  IDEA_ENRICH
  TASK_GENERATION
  SPEC_GENERATION
  NEXT_ACTION
  TASK_PROMPT
  PR_SUMMARY
}

enum AIRunStatus {
  QUEUED
  RUNNING
  COMPLETED
  FAILED
}

enum PRStatus {
  OPEN
  DRAFT
  MERGED
  CLOSED
}

enum CheckConclusion {
  SUCCESS
  FAILURE
  NEUTRAL
  CANCELLED
  SKIPPED
  TIMED_OUT
  ACTION_REQUIRED
  STALE
  STARTUP_FAILURE
  UNKNOWN
}

model User {
  id          String      @id @default(cuid())
  email       String      @unique
  name        String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  workspaces  Workspace[]
}

model Workspace {
  id          String      @id @default(cuid())
  name        String
  slug        String      @unique
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  ownerId     String
  owner       User        @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  ideas       Idea[]
  projects    Project[]
  repositories Repository[]
  promptTemplates PromptTemplate[]
  aiRuns      AIRun[]
}

model Idea {
  id            String      @id @default(cuid())
  title         String
  summary       String?
  description   String?
  problem       String?
  targetUser    String?
  whyNow        String?
  monetization  String?
  risks         String?
  assumptions   String?
  score         Int?
  status        IdeaStatus  @default(INBOX)
  tags          String[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  workspaceId   String
  workspace     Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  project       Project?
  aiRuns        AIRun[]
}

model Project {
  id            String      @id @default(cuid())
  name          String
  slug          String
  description   String?
  stage         ProjectStage @default(CLARIFYING)
  healthScore   Int?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  workspaceId   String
  workspace     Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  ideaId        String?     @unique
  idea          Idea?       @relation(fields: [ideaId], references: [id], onDelete: SetNull)

  repositoryId  String?
  repository    Repository? @relation(fields: [repositoryId], references: [id], onDelete: SetNull)

  tasks         Task[]
  documents     Document[]
  aiRuns        AIRun[]
  pullRequests  PullRequest[]
  activities    ActivityEvent[]

  @@unique([workspaceId, slug])
}

model Task {
  id               String      @id @default(cuid())
  title            String
  description      String?
  acceptanceCriteria String?
  status           TaskStatus  @default(TODO)
  priority         Priority    @default(MEDIUM)
  estimateHours    Float?
  aiGenerated      Boolean     @default(false)
  relevantFiles    String[]
  dueDate          DateTime?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  projectId        String
  project          Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)

  linkedPullRequestId String?
  linkedPullRequest PullRequest? @relation("TaskLinkedPR", fields: [linkedPullRequestId], references: [id], onDelete: SetNull)

  aiRuns           AIRun[]
  activities       ActivityEvent[]
}

model Document {
  id            String        @id @default(cuid())
  title         String
  type          DocumentType
  content       String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  projectId     String
  project       Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model Repository {
  id            String        @id @default(cuid())
  githubNodeId  String?       @unique
  githubRepoId  BigInt?       @unique
  owner         String
  name          String
  fullName      String        @unique
  defaultBranch String?
  isPrivate     Boolean       @default(true)
  installationId String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  workspaceId   String
  workspace     Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  projects      Project[]
  pullRequests  PullRequest[]
  checkRuns     CheckRun[]
}

model PullRequest {
  id            String        @id @default(cuid())
  githubPrId    BigInt?       @unique
  number        Int
  title         String
  url           String
  headBranch    String
  baseBranch    String
  status        PRStatus
  authorLogin   String?
  lastCommitSha String?
  createdAt     DateTime
  updatedAt     DateTime

  repositoryId  String
  repository    Repository    @relation(fields: [repositoryId], references: [id], onDelete: Cascade)

  projectId     String?
  project       Project?      @relation(fields: [projectId], references: [id], onDelete: SetNull)

  linkedTasks   Task[]        @relation("TaskLinkedPR")
  checkRuns     CheckRun[]
}

model CheckRun {
  id              String          @id @default(cuid())
  githubCheckRunId BigInt?        @unique
  name            String
  status          String?
  conclusion      CheckConclusion @default(UNKNOWN)
  detailsUrl      String?
  startedAt       DateTime?
  completedAt     DateTime?
  headSha         String?

  repositoryId    String
  repository      Repository      @relation(fields: [repositoryId], references: [id], onDelete: Cascade)

  pullRequestId   String?
  pullRequest     PullRequest?    @relation(fields: [pullRequestId], references: [id], onDelete: SetNull)
}

model AIRun {
  id            String        @id @default(cuid())
  type          AIRunType
  status        AIRunStatus   @default(QUEUED)
  modelName     String?
  input         String
  output        String?
  error         String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  workspaceId   String
  workspace     Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  projectId     String?
  project       Project?      @relation(fields: [projectId], references: [id], onDelete: SetNull)

  taskId        String?
  task          Task?         @relation(fields: [taskId], references: [id], onDelete: SetNull)

  ideaId        String?
  idea          Idea?         @relation(fields: [ideaId], references: [id], onDelete: SetNull)
}

model PromptTemplate {
  id            String      @id @default(cuid())
  name          String
  description   String?
  content       String
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  workspaceId   String
  workspace     Workspace   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

model ActivityEvent {
  id            String      @id @default(cuid())
  type          String
  message       String?
  metadata      Json?
  createdAt     DateTime    @default(now())

  projectId     String?
  project       Project?    @relation(fields: [projectId], references: [id], onDelete: Cascade)

  taskId        String?
  task          Task?       @relation(fields: [taskId], references: [id], onDelete: Cascade)
}
```

---

# 7. Environment variables

Create `.env` with:

```bash
DATABASE_URL=
ANTHROPIC_API_KEY=
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

For the first internal build, local-only auth is acceptable if needed, but the structure should be ready for real auth.

---

# 8. UI spec to follow

## App style

* Dark premium
* Frosted panels with subtle transparency
* Strong hierarchy
* Spacious but not wasteful
* Keyboard-friendly
* No visual clutter

## Navigation layout

* Fixed left sidebar
* Top utility bar with search and quick add
* Main content area centered and roomy

## Pages

### Home

Show:

* Next best action
* Today tasks
* Active projects
* Blocked tasks
* Recent PRs
* Recent AI runs

### Ideas

Show:

* Idea cards or list
* Search and filters
* New idea button
* AI enrich action
* Convert to project action

### Idea detail

Show:

* Summary
* Description
* Problem
* Target user
* Why now
* Monetization
* Risks
* Assumptions
* Score
* AI output history

### Projects

Show:

* Project cards with stage, task count, repo status, health signal

### Project detail

Tabs:

* Overview
* Roadmap
* Tasks
* Docs
* GitHub
* AI Runs
* Settings

### Tasks

* List and kanban views
* Drawer detail view
* Generate Claude prompt action

### Docs

* Markdown editor
* Create new doc
* Generate MVP spec with AI

### GitHub

* Connected repo details
* PR list
* Check status if available
* Manual sync action

### AI Runs

* Type
* Status
* Target item
* Time
* View output

### Settings

* Prompt templates
* Repo settings
* CLAUDE.md generator

---

# 9. Build sequence

Follow this exact order. Do not jump around unless blocked.

## Phase 1. Foundation

1. Bootstrap Next.js app
2. Install Tailwind and shadcn/ui
3. Set up Prisma and PostgreSQL
4. Create app shell and sidebar layout
5. Create placeholder routes

## Phase 2. Data layer

6. Implement Prisma schema
7. Run migration
8. Create seed script
9. Seed sample data

## Phase 3. Ideas

10. Build Ideas list page
11. Build create idea modal or page
12. Build Idea detail page
13. Add AI enrich flow
14. Save AI output as AIRun
15. Add convert idea to project flow

## Phase 4. Projects

16. Build Projects list page
17. Build Project detail page shell
18. Add stage system
19. Add Overview tab with activity feed

## Phase 5. Tasks

20. Build task CRUD
21. Add task board and list views
22. Add task detail drawer
23. Add task-to-project linking
24. Add acceptance criteria and relevant files fields

## Phase 6. Docs

25. Build docs list in project
26. Build markdown editor
27. Add create/edit doc flow
28. Add AI MVP spec generation

## Phase 7. Dashboard

29. Build Home dashboard
30. Show real data from tasks, projects, PRs, AI runs
31. Add next best action logic, simple first version

## Phase 8. Prompt templates

32. Build PromptTemplate CRUD
33. Seed default templates
34. Add variable rendering helper
35. Make AI routes use templates where practical

## Phase 9. GitHub

36. Set up GitHub App utilities
37. Add webhook endpoint
38. Add repository model logic
39. Add manual repo connect flow
40. Sync PRs for connected repos
41. Display PRs in project GitHub tab
42. Add check runs if possible

## Phase 10. Claude handoff

43. Build task prompt generator
44. Save task prompt as AIRun
45. Add copy prompt action
46. Add CLAUDE.md generator in project settings
47. Add `.claude/hooks.json` template in settings or docs

## Phase 11. Polish

48. Add loading states
49. Add error states
50. Add empty states
51. Add activity events on major actions
52. Improve spacing and consistency
53. Remove dead code
54. Review architecture boundaries
55. Produce ship checklist

---

# 10. Service layer responsibilities

## idea.service.ts

Responsible for:

* create idea
* update idea
* score idea
* convert idea to project
* create activity events

## project.service.ts

Responsible for:

* create project
* update stage
* fetch project detail data
* compute simple project health data if needed

## task.service.ts

Responsible for:

* create task
* update task
* move task status
* fetch project tasks
* link task to PR

## document.service.ts

Responsible for:

* create document
* update document
* fetch project documents

## ai-run.service.ts

Responsible for:

* create AI run records
* mark status transitions
* save output/error

## github-sync.service.ts

Responsible for:

* sync repo metadata
* sync PRs
* sync check runs
* upsert webhook payloads

---

# 11. AI route behavior

## idea-enrich

Input:

* idea id

Behavior:

* load idea
* generate structured enrichment
* save AI run
* return parsed or raw result

## task-breakdown

Input:

* project id

Behavior:

* generate MVP tasks
* save AI run
* optionally allow creating tasks directly after confirmation

## spec-generate

Input:

* project id

Behavior:

* generate markdown MVP spec
* save AI run
* save document

## next-action

Input:

* project id

Behavior:

* inspect project, tasks, PR state
* return single recommended next action
* save AI run

---

# 12. Prompt template defaults

## idea enrich

```text
You are a product strategist.

Turn this raw idea into a structured product concept.

Return JSON with:
- summary
- problem
- targetUser
- whyNow
- monetization
- risks
- assumptions
- score (1-100)

Idea title:
{{idea_title}}

Idea description:
{{idea_description}}
```

## task breakdown

```text
Turn this project into an MVP execution plan.

Return JSON:
{
  "tasks": [
    {
      "title": "",
      "description": "",
      "priority": "LOW|MEDIUM|HIGH|URGENT",
      "acceptanceCriteria": ""
    }
  ]
}

Project:
{{project_name}}

Description:
{{project_description}}
```

## MVP spec

```text
Create an MVP product spec in markdown.

Include:
- Overview
- User problem
- Core features
- Primary flows
- Technical approach
- MVP boundaries
- Future ideas

Project:
{{project_name}}

Description:
{{project_description}}
```

## next action

```text
Given this project state, suggest the single most important next action.

Project:
{{project_name}}

Stage:
{{project_stage}}

Open tasks:
{{open_tasks}}

Blocked tasks:
{{blocked_tasks}}

Open PRs:
{{open_prs}}

Return:
- recommended_action
- reason
```

## task coding prompt

```text
Implement this task in ForgeOS.

Task title:
{{task_title}}

Task description:
{{task_description}}

Acceptance criteria:
{{acceptance_criteria}}

Project context:
{{project_context}}

Relevant files:
{{relevant_files}}

Instructions:
- Inspect the current implementation before changing anything
- Keep the solution minimal and clean
- Reuse existing patterns
- Update types if needed
- Add loading/error states if UI is involved
- Briefly explain what changed
```

---

# 13. CLAUDE.md content to add to repo

Create a root file called `CLAUDE.md` with this content:

```md
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
```

---

# 14. Claude hooks file

Create `.claude/hooks.json`:

```json
{
  "hooks": [
    {
      "event": "PostToolUse",
      "matcher": "Write|Edit|MultiEdit",
      "hooks": [
        {
          "type": "command",
          "command": "pnpm lint"
        }
      ]
    }
  ]
}
```

This is the minimal starting point. More automation can come later.

---

# 15. Core coding prompts for Claude Code

Use these prompts in sequence during the build.

## Prompt 1. Foundation

```text
We are building a product called ForgeOS.

Goal:
Set up the initial app foundation.

Tech stack:
- Next.js latest App Router
- TypeScript
- Tailwind
- shadcn/ui
- Prisma
- PostgreSQL

Tasks:
1. Initialize the project
2. Configure Tailwind and shadcn/ui
3. Set up Prisma with PostgreSQL
4. Add a clean app shell layout with sidebar + topbar
5. Create placeholder routes:
   /
   /ideas
   /projects
   /tasks
   /docs
   /github
   /ai-runs
   /settings

Requirements:
- Clean folder structure
- Strict TypeScript
- Premium dark UI base
- Reusable layout components

Output:
- Working app shell
- Prisma ready
- Placeholder pages
- Short summary of files created
```

## Prompt 2. Prisma + seed

```text
Implement the Prisma schema for ForgeOS using the schema in the master build doc.

Requirements:
- Add enums and relations cleanly
- Generate initial migration
- Create a seed script with:
  - 1 user
  - 1 workspace
  - 3 sample ideas
  - 2 sample projects
  - tasks and docs

Output:
- prisma/schema.prisma
- migration files
- prisma/seed.ts
- instructions to run seed
```

## Prompt 3. Ideas

```text
Build the Ideas feature.

Requirements:
- /ideas list page
- idea card/list components
- create idea modal or page
- idea detail page at /ideas/[ideaId]
- show title, summary, status, score, tags
- clean empty states and loading states

Also:
- add an AI Enrich button on idea detail
- create AI route using Anthropic
- save AI output as AIRun

Use the master build doc structure and conventions.
```

## Prompt 4. Idea to project conversion

```text
Build the idea-to-project conversion flow.

Requirements:
- Convert action from idea detail
- Create project linked to idea
- Mark idea as CONVERTED
- Generate safe project slug
- Redirect to new project page
- Create activity events
```

## Prompt 5. Projects

```text
Build the Projects feature.

Requirements:
- /projects list page
- project cards with stage, repo status, task count, last activity
- project detail route /projects/[projectId]
- tabs:
  - Overview
  - Roadmap
  - Tasks
  - Docs
  - GitHub
  - AI Runs
  - Settings

For now make all tabs real pages/components with Overview populated first.
```

## Prompt 6. Tasks

```text
Implement the Tasks system.

Requirements:
- task CRUD
- task list and kanban views inside project
- task detail drawer
- fields:
  - title
  - description
  - acceptanceCriteria
  - priority
  - estimateHours
  - dueDate
  - relevantFiles
- status transitions
- activity events
```

## Prompt 7. Docs

```text
Build the Docs feature.

Requirements:
- project docs list
- create/edit document flow
- markdown editor
- AI Generate MVP Spec button
- save AI run
- save generated markdown as TECH_SPEC document
```

## Prompt 8. Dashboard

```text
Build the Home dashboard.

Requirements:
- next best action card
- today tasks
- active projects
- blocked tasks
- recent PRs
- recent AI runs
- polished empty states

Use real database data where available.
```

## Prompt 9. Prompt templates

```text
Build PromptTemplate support.

Requirements:
- PromptTemplate CRUD UI
- seed default templates from the master build doc
- add helper to render {{variables}}
- use templates in AI routes where practical
```

## Prompt 10. GitHub foundation

```text
Set up GitHub App integration for ForgeOS.

Requirements:
- env support
- Octokit GitHub App utilities
- webhook endpoint with signature verification
- repository persistence model usage
- manual repo connect flow

Do not overbuild installation UX yet. Focus on a robust foundation.
```

## Prompt 11. PR sync

```text
Build PR sync for connected repositories.

Requirements:
- sync open PRs into database
- show PR list in project GitHub tab
- columns:
  - PR number
  - title
  - head branch
  - status
  - updated time
- manual sync button
- if possible fetch check runs too
```

## Prompt 12. Claude handoff

```text
Build the Claude handoff layer.

Requirements:
- task detail drawer gets:
  - Generate Claude Prompt
  - Copy Prompt
- prompt uses task title, description, acceptance criteria, project context, relevant files
- save prompt as AIRun of type TASK_PROMPT
- add CLAUDE.md generator in project settings
- add hooks.json template helper in settings or docs
```

## Prompt 13. Polish

```text
Do a final polish pass across ForgeOS.

Tasks:
1. Improve UI consistency
2. Fix layout issues
3. Add loading states
4. Add error states
5. Add empty states
6. Improve button labeling
7. Ensure major actions create ActivityEvent records
8. Review TypeScript strictness
9. Remove dead code
10. Highlight weak architectural spots

Output:
- polished app
- ship checklist
- sensible v2 roadmap
```

---

# 16. GitHub integration implementation notes

## GitHub App direction

Use a GitHub App, not a plain OAuth-only integration, because the app should eventually support:

* repo installs
* webhook sync
* PR visibility
* check runs
* future review automation

## Initial permissions

Start read-only if needed:

* metadata
* pull requests
* contents
* checks
* actions
* issues

## Webhooks to support first

* pull_request
* check_run
* installation
* installation_repositories

## Initial product behavior

* manual repo connect is acceptable for v1
* webhook endpoint should upsert PRs and check runs
* project GitHub tab should work even if check runs are missing

---

# 17. Success criteria for MVP

ForgeOS v1 is successful if a user can:

1. Create ideas
2. Enrich ideas with AI
3. Convert an idea into a project
4. Create tasks for the project
5. Generate an MVP spec
6. Generate Claude prompts for tasks
7. Connect a GitHub repo
8. See open PRs for that project
9. Use the dashboard to decide what to do next

If those 9 things work cleanly, the MVP is good.

---

# 18. Things not to do in v1

Do not add yet:

* multi-user collaboration
* complex permissions
* deep analytics
* billing
* mobile app
* autonomous agents everywhere
* overly advanced roadmap logic
* too many views
* too much automation before core flows feel good

---

# 19. Expected v2 immediately after MVP

Best next additions:

* task-to-PR linking assistant
* richer next-action engine
* project health score
* stale project detector
* check-run failure summaries
* weekly review page
* better GitHub installation UX
* automatic task generation from specs

---

# 20. Final instruction to Claude Code

When building ForgeOS from this document:

* Always inspect the current repo before making changes
* Build in the exact sequence above
* Keep architecture clean
* Keep the UI premium and fast
* Do not overengineer
* Do not skip loading, empty, and error states
* Prefer shippable decisions over perfect abstractions
* At the end of each major step, summarize what changed and what remains

This document is the build source of truth until MVP ships.

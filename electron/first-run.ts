/**
 * First-run setup: applies Prisma migrations and seeds demo data via PGlite.
 * Reads migration SQL files directly and executes them against the embedded database.
 */
import * as fs from "fs";
import * as path from "path";
import { PGlite } from "@electric-sql/pglite";

/** Prisma migration tracking table (matches Prisma's own format). */
async function ensureMigrationTable(db: PGlite): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) NOT NULL PRIMARY KEY,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    );
  `);
}

/** Get list of already-applied migration names. */
async function getAppliedMigrations(db: PGlite): Promise<Set<string>> {
  const result = await db.query<{ migration_name: string }>(
    `SELECT "migration_name" FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL`
  );
  return new Set(result.rows.map((r) => r.migration_name));
}

/** Get sorted list of migration directories. */
function getMigrationDirs(migrationsPath: string): string[] {
  if (!fs.existsSync(migrationsPath)) return [];
  return fs
    .readdirSync(migrationsPath)
    .filter((name) => {
      const fullPath = path.join(migrationsPath, name, "migration.sql");
      return fs.existsSync(fullPath);
    })
    .sort();
}

/** Apply pending migrations to PGlite. */
export async function applyMigrations(
  db: PGlite,
  migrationsPath: string
): Promise<number> {
  await ensureMigrationTable(db);
  const applied = await getAppliedMigrations(db);
  const dirs = getMigrationDirs(migrationsPath);

  let count = 0;
  for (const dir of dirs) {
    if (applied.has(dir)) continue;

    const sqlPath = path.join(migrationsPath, dir, "migration.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    const migrationId = crypto.randomUUID();

    console.log(`[first-run] Applying migration: ${dir}`);
    try {
      await db.exec(sql);
      await db.query(
        `INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "finished_at", "applied_steps_count")
         VALUES ($1, $2, $3, now(), 1)`,
        [migrationId, "", dir]
      );
      count++;
    } catch (err) {
      console.error(`[first-run] Migration ${dir} failed:`, err);
      throw err;
    }
  }

  return count;
}

/** Seed default user and demo data (mirrors prisma/seed.ts logic). */
export async function seedData(db: PGlite): Promise<void> {
  // Check if data already exists
  const existing = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM "User"`
  );
  if (parseInt(existing.rows[0].count) > 0) {
    console.log("[first-run] Data already seeded, skipping");
    return;
  }

  console.log("[first-run] Seeding demo data...");

  // We use bcryptjs hash of "forgeos123" with 12 rounds.
  // Pre-computed to avoid bundling bcryptjs in the Electron main process.
  const passwordHash =
    "$2a$12$LJ3m4ys3KZgNNrEOPAMPcO9hW7P.dN4JLDJjjkE3tlVYMBb.6o6/2";

  const userId = generateCuid();
  const workspaceId = generateCuid();

  await db.exec(`
    INSERT INTO "User" ("id", "email", "name", "passwordHash", "createdAt", "updatedAt")
    VALUES ('${userId}', 'founder@forgeos.dev', 'Founder', '${passwordHash}', now(), now());

    INSERT INTO "Workspace" ("id", "name", "slug", "ownerId", "createdAt", "updatedAt")
    VALUES ('${workspaceId}', 'ForgeOS', 'forgeos', '${userId}', now(), now());
  `);

  // Ideas
  const idea1Id = generateCuid();
  const idea2Id = generateCuid();
  const idea3Id = generateCuid();
  await db.exec(`
    INSERT INTO "Idea" ("id", "title", "summary", "description", "status", "tags", "workspaceId", "createdAt", "updatedAt")
    VALUES
      ('${idea1Id}', 'AI-powered code review assistant', 'A tool that automatically reviews pull requests using AI', 'Build an AI assistant that analyzes code changes in PRs and provides actionable feedback on code quality, potential bugs, and best practices.', 'INBOX', ARRAY['ai','developer-tools','github'], '${workspaceId}', now(), now()),
      ('${idea2Id}', 'Smart project health dashboard', 'Real-time project health monitoring with AI insights', 'A dashboard that aggregates signals from GitHub, CI/CD, and task management to provide a single health score for each project.', 'REVIEWING', ARRAY['dashboard','analytics','monitoring'], '${workspaceId}', now(), now()),
      ('${idea3Id}', 'Automated MVP spec generator', 'Generate complete MVP specs from a single idea description', 'Take a rough idea and generate a full MVP specification including user stories, tech approach, and prioritized feature list.', 'VALIDATED', ARRAY['ai','productivity','specs'], '${workspaceId}', now(), now());

    UPDATE "Idea" SET "problem" = 'Writing specs is time-consuming and often skipped by solo builders',
      "targetUser" = 'Solo founders and indie hackers',
      "whyNow" = 'AI is now good enough to generate useful first-draft specs',
      "monetization" = 'SaaS subscription for teams',
      "risks" = 'AI output quality may vary',
      "assumptions" = 'Users want structured specs, not just brainstorm notes',
      "score" = 82
    WHERE "id" = '${idea3Id}';
  `);

  // Projects
  const proj1Id = generateCuid();
  const proj2Id = generateCuid();
  await db.exec(`
    INSERT INTO "Project" ("id", "name", "slug", "description", "stage", "workspaceId", "createdAt", "updatedAt")
    VALUES ('${proj1Id}', 'ForgeOS Core', 'forgeos-core', 'The core ForgeOS platform - ideas, projects, tasks, and AI workflows.', 'BUILDING', '${workspaceId}', now(), now());

    INSERT INTO "Project" ("id", "name", "slug", "description", "stage", "workspaceId", "ideaId", "createdAt", "updatedAt")
    VALUES ('${proj2Id}', 'Spec Generator', 'spec-generator', 'AI-powered MVP specification generator derived from the validated idea.', 'CLARIFYING', '${workspaceId}', '${idea3Id}', now(), now());

    UPDATE "Idea" SET "status" = 'CONVERTED' WHERE "id" = '${idea3Id}';
  `);

  // Tasks
  await db.exec(`
    INSERT INTO "Task" ("id", "title", "description", "acceptanceCriteria", "status", "priority", "estimateHours", "projectId", "createdAt", "updatedAt") VALUES
      ('${generateCuid()}', 'Set up Next.js foundation with Tailwind and shadcn/ui', 'Bootstrap the app with the required tech stack', 'App runs locally with dark theme, sidebar layout, and placeholder routes', 'DONE', 'HIGH', 4, '${proj1Id}', now(), now()),
      ('${generateCuid()}', 'Implement Prisma schema and seed data', 'Create the full database schema and seed sample data', 'All models created, migration runs, seed populates sample data', 'IN_PROGRESS', 'HIGH', 3, '${proj1Id}', now(), now()),
      ('${generateCuid()}', 'Build Ideas list and detail pages', 'Create the Ideas feature with list view, detail page, and create modal', 'Can view, create, and browse ideas with proper UI', 'TODO', 'HIGH', 6, '${proj1Id}', now(), now()),
      ('${generateCuid()}', 'Add AI idea enrichment flow', 'Integrate Anthropic API to enrich ideas with structured analysis', 'Enrich button works, AI output saved as AIRun, idea fields updated', 'TODO', 'MEDIUM', 4, '${proj1Id}', now(), now()),
      ('${generateCuid()}', 'Define spec template structure', 'Design the markdown template for generated specs', 'TODO', 'HIGH', 2, '${proj2Id}', now(), now()),
      ('${generateCuid()}', 'Research prompt engineering for spec generation', 'Test different prompt strategies for generating useful MVP specs', 'BLOCKED', 'MEDIUM', 3, '${proj2Id}', now(), now());
  `);

  // Documents
  await db.exec(`
    INSERT INTO "Document" ("id", "title", "type", "content", "projectId", "createdAt", "updatedAt") VALUES
      ('${generateCuid()}', 'ForgeOS PRD', 'PRD', '# ForgeOS Product Requirements

## Overview
ForgeOS is an AI-native product execution system.

## Core Features
- Idea capture and enrichment
- Project management
- Task tracking
- AI-powered workflows
- GitHub integration

## Target User
Solo builders, indie hackers, AI-native developers.', '${proj1Id}', now(), now()),
      ('${generateCuid()}', 'ForgeOS Technical Spec', 'TECH_SPEC', '# ForgeOS Technical Specification

## Stack
- Next.js App Router
- TypeScript
- Prisma + PostgreSQL
- Tailwind + shadcn/ui
- Anthropic API

## Architecture
- Server components by default
- Service layer for business logic
- Route handlers for API
- Prisma for data access', '${proj1Id}', now(), now());
  `);

  // Prompt template
  await db.exec(`
    INSERT INTO "PromptTemplate" ("id", "name", "description", "content", "workspaceId", "createdAt", "updatedAt")
    VALUES ('${generateCuid()}', 'Idea Enrich', 'Enriches a raw idea into a structured product concept',
      'You are a product strategist.\n\nTurn this raw idea into a structured product concept.\n\nReturn JSON with:\n- summary\n- problem\n- targetUser\n- whyNow\n- monetization\n- risks\n- assumptions\n- score (1-100)\n\nIdea title:\n{{idea_title}}\n\nIdea description:\n{{idea_description}}',
      '${workspaceId}', now(), now());
  `);

  // Activity events
  await db.exec(`
    INSERT INTO "ActivityEvent" ("id", "type", "message", "projectId", "createdAt") VALUES
      ('${generateCuid()}', 'project.created', 'Project ForgeOS Core was created', '${proj1Id}', now()),
      ('${generateCuid()}', 'project.created', 'Project Spec Generator was created from idea', '${proj2Id}', now()),
      ('${generateCuid()}', 'idea.converted', 'Idea ''Automated MVP spec generator'' was converted to project', '${proj2Id}', now());
  `);

  console.log("[first-run] Seed completed: founder@forgeos.dev / forgeos123");
}

/** Check if this is the first run (no data directory). */
export function isFirstRun(dataDir: string): boolean {
  return !fs.existsSync(dataDir);
}

/** Simple CUID-like ID generator. */
function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
  return `c${timestamp}${random}`;
}

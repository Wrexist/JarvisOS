import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // User (password: "forgeos123")
  const passwordHash = await bcrypt.hash("forgeos123", 12);
  const user = await prisma.user.upsert({
    where: { email: "founder@forgeos.dev" },
    update: { passwordHash },
    create: {
      email: "founder@forgeos.dev",
      name: "Founder",
      passwordHash,
    },
  });

  // Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: "forgeos" },
    update: {},
    create: {
      name: "ForgeOS",
      slug: "forgeos",
      ownerId: user.id,
    },
  });

  // Ideas
  await prisma.idea.create({
    data: {
      title: "AI-powered code review assistant",
      summary: "A tool that automatically reviews pull requests using AI",
      description:
        "Build an AI assistant that analyzes code changes in PRs and provides actionable feedback on code quality, potential bugs, and best practices.",
      status: "INBOX",
      tags: ["ai", "developer-tools", "github"],
      workspaceId: workspace.id,
    },
  });

  await prisma.idea.create({
    data: {
      title: "Smart project health dashboard",
      summary: "Real-time project health monitoring with AI insights",
      description:
        "A dashboard that aggregates signals from GitHub, CI/CD, and task management to provide a single health score for each project.",
      status: "REVIEWING",
      tags: ["dashboard", "analytics", "monitoring"],
      workspaceId: workspace.id,
    },
  });

  const idea3 = await prisma.idea.create({
    data: {
      title: "Automated MVP spec generator",
      summary: "Generate complete MVP specs from a single idea description",
      description:
        "Take a rough idea and generate a full MVP specification including user stories, tech approach, and prioritized feature list.",
      problem: "Writing specs is time-consuming and often skipped by solo builders",
      targetUser: "Solo founders and indie hackers",
      whyNow: "AI is now good enough to generate useful first-draft specs",
      monetization: "SaaS subscription for teams",
      risks: "AI output quality may vary",
      assumptions: "Users want structured specs, not just brainstorm notes",
      score: 82,
      status: "VALIDATED",
      tags: ["ai", "productivity", "specs"],
      workspaceId: workspace.id,
    },
  });

  // Projects
  const project1 = await prisma.project.create({
    data: {
      name: "ForgeOS Core",
      slug: "forgeos-core",
      description:
        "The core ForgeOS platform - ideas, projects, tasks, and AI workflows.",
      stage: "BUILDING",
      workspaceId: workspace.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Spec Generator",
      slug: "spec-generator",
      description:
        "AI-powered MVP specification generator derived from the validated idea.",
      stage: "CLARIFYING",
      workspaceId: workspace.id,
      ideaId: idea3.id,
    },
  });

  // Update idea3 to CONVERTED
  await prisma.idea.update({
    where: { id: idea3.id },
    data: { status: "CONVERTED" },
  });

  // Tasks for project1
  await prisma.task.createMany({
    data: [
      {
        title: "Set up Next.js foundation with Tailwind and shadcn/ui",
        description: "Bootstrap the app with the required tech stack",
        acceptanceCriteria:
          "App runs locally with dark theme, sidebar layout, and placeholder routes",
        status: "DONE",
        priority: "HIGH",
        estimateHours: 4,
        projectId: project1.id,
      },
      {
        title: "Implement Prisma schema and seed data",
        description: "Create the full database schema and seed sample data",
        acceptanceCriteria:
          "All models created, migration runs, seed populates sample data",
        status: "IN_PROGRESS",
        priority: "HIGH",
        estimateHours: 3,
        projectId: project1.id,
      },
      {
        title: "Build Ideas list and detail pages",
        description:
          "Create the Ideas feature with list view, detail page, and create modal",
        acceptanceCriteria:
          "Can view, create, and browse ideas with proper UI",
        status: "TODO",
        priority: "HIGH",
        estimateHours: 6,
        projectId: project1.id,
      },
      {
        title: "Add AI idea enrichment flow",
        description:
          "Integrate Anthropic API to enrich ideas with structured analysis",
        acceptanceCriteria:
          "Enrich button works, AI output saved as AIRun, idea fields updated",
        status: "TODO",
        priority: "MEDIUM",
        estimateHours: 4,
        projectId: project1.id,
      },
    ],
  });

  // Tasks for project2
  await prisma.task.createMany({
    data: [
      {
        title: "Define spec template structure",
        description: "Design the markdown template for generated specs",
        status: "TODO",
        priority: "HIGH",
        estimateHours: 2,
        projectId: project2.id,
      },
      {
        title: "Research prompt engineering for spec generation",
        description:
          "Test different prompt strategies for generating useful MVP specs",
        status: "BLOCKED",
        priority: "MEDIUM",
        estimateHours: 3,
        projectId: project2.id,
      },
    ],
  });

  // Documents
  await prisma.document.create({
    data: {
      title: "ForgeOS PRD",
      type: "PRD",
      content:
        "# ForgeOS Product Requirements\n\n## Overview\nForgeOS is an AI-native product execution system.\n\n## Core Features\n- Idea capture and enrichment\n- Project management\n- Task tracking\n- AI-powered workflows\n- GitHub integration\n\n## Target User\nSolo builders, indie hackers, AI-native developers.",
      projectId: project1.id,
    },
  });

  await prisma.document.create({
    data: {
      title: "ForgeOS Technical Spec",
      type: "TECH_SPEC",
      content:
        "# ForgeOS Technical Specification\n\n## Stack\n- Next.js App Router\n- TypeScript\n- Prisma + PostgreSQL\n- Tailwind + shadcn/ui\n- Anthropic API\n\n## Architecture\n- Server components by default\n- Service layer for business logic\n- Route handlers for API\n- Prisma for data access",
      projectId: project1.id,
    },
  });

  // Prompt Templates (5 defaults)
  await prisma.promptTemplate.createMany({
    data: [
      {
        name: "Idea Enrich",
        description: "Enriches a raw idea into a structured product concept",
        content: `You are a product strategist.\n\nTurn this raw idea into a structured product concept.\n\nReturn JSON with:\n- summary\n- problem\n- targetUser\n- whyNow\n- monetization\n- risks\n- assumptions\n- score (1-100)\n\nIdea title:\n{{idea_title}}\n\nIdea description:\n{{idea_description}}`,
        workspaceId: workspace.id,
      },
      {
        name: "Task Breakdown",
        description: "Generates MVP tasks from a project description",
        content: `Turn this project into an MVP execution plan.\n\nReturn JSON:\n{\n  "tasks": [\n    {\n      "title": "",\n      "description": "",\n      "priority": "LOW|MEDIUM|HIGH|URGENT",\n      "acceptanceCriteria": ""\n    }\n  ]\n}\n\nProject:\n{{project_name}}\n\nDescription:\n{{project_description}}`,
        workspaceId: workspace.id,
      },
      {
        name: "MVP Spec",
        description: "Generates a markdown MVP specification",
        content: `Create an MVP product spec in markdown.\n\nInclude:\n- Overview\n- User problem\n- Core features\n- Primary flows\n- Technical approach\n- MVP boundaries\n- Future ideas\n\nProject:\n{{project_name}}\n\nDescription:\n{{project_description}}`,
        workspaceId: workspace.id,
      },
      {
        name: "Next Action",
        description: "Suggests the most important next action for a project",
        content: `Given this project state, suggest the single most important next action.\n\nProject:\n{{project_name}}\n\nStage:\n{{project_stage}}\n\nOpen tasks:\n{{open_tasks}}\n\nBlocked tasks:\n{{blocked_tasks}}\n\nOpen PRs:\n{{open_prs}}\n\nReturn:\n- recommended_action\n- reason`,
        workspaceId: workspace.id,
      },
      {
        name: "Task Coding Prompt",
        description: "Generates a Claude Code prompt for implementing a task",
        content: `Implement this task in ForgeOS.\n\nTask title:\n{{task_title}}\n\nTask description:\n{{task_description}}\n\nAcceptance criteria:\n{{acceptance_criteria}}\n\nProject context:\n{{project_context}}\n\nRelevant files:\n{{relevant_files}}\n\nInstructions:\n- Inspect the current implementation before changing anything\n- Keep the solution minimal and clean\n- Reuse existing patterns\n- Update types if needed\n- Add loading/error states if UI is involved\n- Briefly explain what changed`,
        workspaceId: workspace.id,
      },
    ],
  });

  // Activity Events
  await prisma.activityEvent.createMany({
    data: [
      {
        type: "project.created",
        message: "Project ForgeOS Core was created",
        projectId: project1.id,
      },
      {
        type: "project.created",
        message: "Project Spec Generator was created from idea",
        projectId: project2.id,
      },
      {
        type: "idea.converted",
        message: "Idea 'Automated MVP spec generator' was converted to project",
        projectId: project2.id,
      },
    ],
  });

  console.log("Seed completed successfully!");
  console.log(`  User: ${user.email}`);
  console.log(`  Workspace: ${workspace.name}`);
  console.log(`  Ideas: 3`);
  console.log(`  Projects: 2`);
  console.log(`  Tasks: 6`);
  console.log(`  Documents: 2`);
  console.log(`  Prompt Templates: 1`);
  console.log(`  Activity Events: 3`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/session";

const VALID_STATUSES = ["INBOX", "REVIEWING", "VALIDATED", "CONVERTED", "ARCHIVED", "TODO", "IN_PROGRESS", "BLOCKED", "DONE"];
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const VALID_STAGES = ["CLARIFYING", "PLANNING", "READY_TO_BUILD", "BUILDING", "TESTING", "SHIPPED", "PAUSED", "ARCHIVED"];
const VALID_TYPES = ["PRD", "TECH_SPEC", "NOTES", "RETRO", "SCRATCHPAD"];

function parseSearchQuery(raw: string): {
  text: string;
  filters: Record<string, string>;
} {
  const filters: Record<string, string> = {};
  const text = raw
    .replace(/(\w+):(\S+)/g, (_, key: string, value: string) => {
      if (value) filters[key.toLowerCase()] = value.toUpperCase();
      return "";
    })
    .trim();
  return { text, filters };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({
        ideas: [],
        projects: [],
        tasks: [],
        documents: [],
      });
    }

    const workspaceId = await getSessionWorkspaceId();
    const { text, filters } = parseSearchQuery(q);

    const textFilter = text.length >= 2 ? text : undefined;

    const [ideas, projects, tasks, documents] = await Promise.all([
      prisma.idea.findMany({
        where: {
          workspaceId,
          ...(filters.status && VALID_STATUSES.includes(filters.status) && {
            status: filters.status as never,
          }),
          ...(textFilter && {
            OR: [
              { title: { contains: textFilter, mode: "insensitive" as const } },
              {
                summary: {
                  contains: textFilter,
                  mode: "insensitive" as const,
                },
              },
            ],
          }),
        },
        select: { id: true, title: true, status: true, score: true },
        take: 5,
      }),
      prisma.project.findMany({
        where: {
          workspaceId,
          ...(filters.stage && VALID_STAGES.includes(filters.stage) && {
            stage: filters.stage as never,
          }),
          ...(textFilter && {
            OR: [
              { name: { contains: textFilter, mode: "insensitive" as const } },
              {
                description: {
                  contains: textFilter,
                  mode: "insensitive" as const,
                },
              },
            ],
          }),
        },
        select: { id: true, name: true, stage: true },
        take: 5,
      }),
      prisma.task.findMany({
        where: {
          project: {
            workspaceId,
            ...(filters.project && {
              name: {
                contains: filters.project,
                mode: "insensitive" as const,
              },
            }),
          },
          ...(filters.status && VALID_STATUSES.includes(filters.status) && {
            status: filters.status as never,
          }),
          ...(filters.priority && VALID_PRIORITIES.includes(filters.priority) && {
            priority: filters.priority as never,
          }),
          ...(textFilter && {
            OR: [
              { title: { contains: textFilter, mode: "insensitive" as const } },
              {
                description: {
                  contains: textFilter,
                  mode: "insensitive" as const,
                },
              },
            ],
          }),
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          project: { select: { id: true, name: true } },
        },
        take: 5,
      }),
      prisma.document.findMany({
        where: {
          project: { workspaceId },
          ...(filters.type && VALID_TYPES.includes(filters.type) && {
            type: filters.type as never,
          }),
          ...(textFilter && {
            OR: [
              { title: { contains: textFilter, mode: "insensitive" as const } },
              {
                content: {
                  contains: textFilter,
                  mode: "insensitive" as const,
                },
              },
            ],
          }),
        },
        select: {
          id: true,
          title: true,
          type: true,
          project: { select: { id: true } },
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({ ideas, projects, tasks, documents });
  } catch (error) {
    logger.error("Search failed:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

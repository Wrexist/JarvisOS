import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/session";

/**
 * Parses filter syntax from search query.
 * Example: "status:blocked my search" → { text: "my search", filters: { status: "blocked" } }
 */
function parseSearchQuery(raw: string): {
  text: string;
  filters: Record<string, string>;
} {
  const filters: Record<string, string> = {};
  const text = raw
    .replace(/(\w+):(\S+)/g, (_, key: string, value: string) => {
      filters[key.toLowerCase()] = value.toLowerCase();
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
          ...(filters.status && {
            status: filters.status.toUpperCase() as never,
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
          ...(filters.stage && {
            stage: filters.stage.toUpperCase() as never,
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
          ...(filters.status && {
            status: filters.status.toUpperCase() as never,
          }),
          ...(filters.priority && {
            priority: filters.priority.toUpperCase() as never,
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
          ...(filters.type && {
            type: filters.type.toUpperCase() as never,
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
    console.error("Search failed:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

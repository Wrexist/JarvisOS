import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultWorkspaceId } from "@/lib/workspace";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ ideas: [], projects: [], tasks: [], documents: [] });
    }

    const workspaceId = await getDefaultWorkspaceId();

    const [ideas, projects, tasks, documents] = await Promise.all([
      prisma.idea.findMany({
        where: {
          workspaceId,
          title: { contains: q, mode: "insensitive" },
        },
        select: { id: true, title: true, status: true },
        take: 5,
      }),
      prisma.project.findMany({
        where: {
          workspaceId,
          name: { contains: q, mode: "insensitive" },
        },
        select: { id: true, name: true, stage: true },
        take: 5,
      }),
      prisma.task.findMany({
        where: {
          project: { workspaceId },
          title: { contains: q, mode: "insensitive" },
        },
        select: {
          id: true,
          title: true,
          status: true,
          project: { select: { id: true, name: true } },
        },
        take: 5,
      }),
      prisma.document.findMany({
        where: {
          project: { workspaceId },
          title: { contains: q, mode: "insensitive" },
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

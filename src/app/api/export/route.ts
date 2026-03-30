import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultWorkspaceId } from "@/lib/workspace";

export async function GET() {
  try {
    const workspaceId = await getDefaultWorkspaceId();

    const [ideas, projects, tasks, documents, promptTemplates, activityEvents] =
      await Promise.all([
        prisma.idea.findMany({ where: { workspaceId } }),
        prisma.project.findMany({ where: { workspaceId } }),
        prisma.task.findMany({
          where: { project: { workspaceId } },
        }),
        prisma.document.findMany({
          where: { project: { workspaceId } },
        }),
        prisma.promptTemplate.findMany({ where: { workspaceId } }),
        prisma.activityEvent.findMany({
          where: { project: { workspaceId } },
          orderBy: { createdAt: "desc" },
          take: 500,
        }),
      ]);

    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      data: {
        ideas,
        projects,
        tasks,
        documents,
        promptTemplates,
        activityEvents,
      },
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="forgeos-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}

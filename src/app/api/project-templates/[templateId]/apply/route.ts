import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { createProject } from "@/server/services/project.service";

interface TaskTemplate {
  title: string;
  description?: string;
  priority?: string;
  acceptanceCriteria?: string;
}

interface DocTemplate {
  title: string;
  type: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params;
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { workspaceId } = auth;

    let projectName: string | undefined;
    try {
      const body = await request.json();
      projectName = typeof body.projectName === "string" ? body.projectName : undefined;
    } catch {
      // Empty body is ok — will use template name
    }

    const template = await prisma.projectTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Create project
    const project = await createProject(workspaceId, {
      name: projectName || template.name,
      description: template.description ?? undefined,
    });

    // Create tasks from template
    const taskTemplates = (template.taskTemplates as unknown as TaskTemplate[]) ?? [];
    if (taskTemplates.length > 0) {
      await prisma.task.createMany({
        data: taskTemplates.map((t) => ({
          title: t.title,
          description: t.description,
          priority: (t.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT") ?? "MEDIUM",
          acceptanceCriteria: t.acceptanceCriteria,
          projectId: project.id,
        })),
      });
    }

    // Create docs from template
    const docTemplates = (template.docTemplates as unknown as DocTemplate[]) ?? [];
    for (const d of docTemplates) {
      await prisma.document.create({
        data: {
          title: d.title,
          type: d.type as "PRD" | "TECH_SPEC" | "NOTES" | "RETRO" | "SCRATCHPAD",
          content: "",
          projectId: project.id,
        },
      });
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to apply template:", error);
    return NextResponse.json(
      { error: "Failed to apply template" },
      { status: 500 }
    );
  }
}

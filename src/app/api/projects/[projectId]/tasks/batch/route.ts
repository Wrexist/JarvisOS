import { NextResponse } from "next/server";
import { createManyTasks } from "@/server/services/task.service";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { apiError } from "@/lib/api-utils";

const batchSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(5000).optional(),
      acceptanceCriteria: z.string().max(5000).optional(),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    })
  ).min(1).max(50),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { projectId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId: auth.workspaceId },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = batchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const result = await createManyTasks(projectId, parsed.data.tasks);
    return NextResponse.json({ count: result.count });
  } catch (error) {
    return apiError("Batch task creation failed", error);
  }
}

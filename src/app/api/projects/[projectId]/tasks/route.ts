import { NextResponse } from "next/server";
import { listProjectTasks, createTask } from "@/server/services/task.service";
import { requireAuth } from "@/lib/session";
import { validateBody, apiError } from "@/lib/api-utils";
import { createTaskSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
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

    const tasks = await listProjectTasks(projectId);
    return NextResponse.json(tasks);
  } catch (error) {
    return apiError("Failed to list tasks", error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { projectId } = await params;

    const projectExists = await prisma.project.findFirst({
      where: { id: projectId, workspaceId: auth.workspaceId },
      select: { id: true },
    });
    if (!projectExists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const data = await validateBody(request, createTaskSchema);
    if (data instanceof NextResponse) return data;

    const task = await createTask(projectId, data);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return apiError("Failed to create task", error);
  }
}

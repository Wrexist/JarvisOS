import { NextResponse } from "next/server";
import { listProjectTasks, createTask } from "@/server/services/task.service";
import { requireAuth } from "@/lib/session";
import { validateBody } from "@/lib/api-utils";
import { createTaskSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { projectId } = await params;
    const tasks = await listProjectTasks(projectId);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to list tasks:", error);
    return NextResponse.json(
      { error: "Failed to list tasks" },
      { status: 500 }
    );
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
    const data = await validateBody(request, createTaskSchema);
    if (data instanceof NextResponse) return data;

    const task = await createTask(projectId, data);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

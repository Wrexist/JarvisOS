import { NextResponse } from "next/server";
import { createManyTasks } from "@/server/services/task.service";
import { z } from "zod";

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
    const { projectId } = await params;
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
    console.error("Batch task creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create tasks" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { apiError } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const ideaId = searchParams.get("ideaId");

    if (!taskId && !ideaId) {
      return NextResponse.json(
        { error: "taskId or ideaId is required" },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        ...(taskId && {
          taskId,
          task: { project: { workspaceId: auth.workspaceId } },
        }),
        ...(ideaId && {
          ideaId,
          idea: { workspaceId: auth.workspaceId },
        }),
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    return apiError("Failed to list comments", error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { content, taskId, ideaId } = await request.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (!taskId && !ideaId) {
      return NextResponse.json(
        { error: "taskId or ideaId is required" },
        { status: 400 }
      );
    }

    // Verify the target task/idea belongs to this workspace
    if (taskId) {
      const task = await prisma.task.findFirst({
        where: { id: taskId, project: { workspaceId: auth.workspaceId } },
        select: { id: true },
      });
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
    }
    if (ideaId) {
      const idea = await prisma.idea.findFirst({
        where: { id: ideaId, workspaceId: auth.workspaceId },
        select: { id: true },
      });
      if (!idea) {
        return NextResponse.json({ error: "Idea not found" }, { status: 404 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorName: auth.userName,
        taskId: taskId || undefined,
        ideaId: ideaId || undefined,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return apiError("Failed to create comment", error);
  }
}

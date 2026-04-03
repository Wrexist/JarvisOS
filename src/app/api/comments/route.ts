import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

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
        ...(taskId && { taskId }),
        ...(ideaId && { ideaId }),
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Failed to list comments:", error);
    return NextResponse.json(
      { error: "Failed to list comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const session = await auth();
    const authorName = session?.user?.name ?? "Unknown";

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

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        authorName,
        taskId: taskId || undefined,
        ideaId: ideaId || undefined,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

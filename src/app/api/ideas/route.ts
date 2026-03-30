import { NextResponse } from "next/server";
import { getDefaultWorkspaceId } from "@/lib/workspace";
import { listIdeas, createIdea } from "@/server/services/idea.service";
import type { IdeaStatus } from "@/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const workspaceId = await getDefaultWorkspaceId();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as IdeaStatus | null;
    const search = searchParams.get("search") ?? undefined;

    const ideas = await listIdeas(workspaceId, {
      status: status ?? undefined,
      search,
    });

    return NextResponse.json(ideas);
  } catch (error) {
    console.error("Failed to list ideas:", error);
    return NextResponse.json(
      { error: "Failed to list ideas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getDefaultWorkspaceId();
    const body = await request.json();

    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const idea = await createIdea(workspaceId, {
      title: body.title,
      description: body.description,
      tags: body.tags,
    });

    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    console.error("Failed to create idea:", error);
    return NextResponse.json(
      { error: "Failed to create idea" },
      { status: 500 }
    );
  }
}

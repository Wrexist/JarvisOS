import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { listIdeas, createIdea } from "@/server/services/idea.service";
import { validateBody } from "@/lib/api-utils";
import { createIdeaSchema } from "@/lib/validations";
import type { IdeaStatus } from "@/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { workspaceId } = auth;
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
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { workspaceId } = auth;
    const data = await validateBody(request, createIdeaSchema);
    if (data instanceof NextResponse) return data;

    const idea = await createIdea(workspaceId, data);

    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    console.error("Failed to create idea:", error);
    return NextResponse.json(
      { error: "Failed to create idea" },
      { status: 500 }
    );
  }
}

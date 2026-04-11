import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { listIdeas, createIdea } from "@/server/services/idea.service";
import { validateBody, apiError } from "@/lib/api-utils";
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
    return apiError("Failed to list ideas", error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { workspaceId } = auth;
    const data = await validateBody(request, createIdeaSchema);
    if (data instanceof NextResponse) return data;

    const idea = await createIdea(workspaceId, data, auth.userId);

    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    return apiError("Failed to create idea", error);
  }
}

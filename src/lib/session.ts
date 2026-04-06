import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Requires authentication. Returns user + workspace or a 401 response.
 * Use in API routes: `const result = await requireAuth(); if (result instanceof NextResponse) return result;`
 */
export async function requireAuth(): Promise<
  | { userId: string; workspaceId: string; userName: string }
  | NextResponse
> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!workspace) {
    return NextResponse.json(
      { error: "No workspace found" },
      { status: 403 }
    );
  }

  return {
    userId: session.user.id,
    workspaceId: workspace.id,
    userName: session.user.name ?? "Unknown",
  };
}

/**
 * Gets the workspace ID for server components.
 * Requires authenticated session — no fallback.
 */
export async function getSessionWorkspaceId(): Promise<string> {
  const session = await auth();

  if (session?.user?.id) {
    const workspace = await prisma.workspace.findFirst({
      where: { ownerId: session.user.id },
      select: { id: true },
    });
    if (workspace) return workspace.id;
  }

  throw new Error(
    "No authenticated workspace. Please sign in."
  );
}

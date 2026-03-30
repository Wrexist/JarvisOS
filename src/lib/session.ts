import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Gets the current session. Returns null if not authenticated.
 */
export async function getSession() {
  return auth();
}

/**
 * Requires authentication. Returns user + workspace or a 401 response.
 * Use in API routes: `const result = await requireAuth(); if (result instanceof NextResponse) return result;`
 */
export async function requireAuth(): Promise<
  | { userId: string; workspaceId: string }
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

  return { userId: session.user.id, workspaceId: workspace.id };
}

/**
 * Gets the workspace ID for server components.
 * Falls back to the first workspace if no auth (for development).
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

  // Fallback for development: return first workspace
  const fallback = await prisma.workspace.findFirst({
    select: { id: true },
  });
  if (!fallback) throw new Error("No workspace found. Run prisma db seed.");
  return fallback.id;
}

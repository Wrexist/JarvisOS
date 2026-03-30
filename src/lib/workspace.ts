import { prisma } from "@/lib/prisma";

/**
 * Returns the default workspace ID for v1 (single-user, no auth).
 * Fetches the first workspace from the database.
 */
export async function getDefaultWorkspaceId(): Promise<string> {
  const workspace = await prisma.workspace.findFirst({
    select: { id: true },
  });
  if (!workspace) {
    throw new Error("No workspace found. Run `prisma db seed` first.");
  }
  return workspace.id;
}

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/session";
import { DocListGlobal } from "@/components/docs/doc-list-global";

export default async function DocsPage() {
  const workspaceId = await getSessionWorkspaceId();
  const documents = await prisma.document.findMany({
    where: { project: { workspaceId } },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const serialized = documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    updatedAt: doc.updatedAt.toISOString(),
    project: doc.project,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Docs</h1>
        <p className="mt-1 text-muted-foreground">
          Specs, notes, and documentation across all projects.
        </p>
      </div>
      <DocListGlobal documents={serialized} />
    </div>
  );
}

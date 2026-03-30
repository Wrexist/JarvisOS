export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getDefaultWorkspaceId } from "@/lib/workspace";
import { DocTypeBadge } from "@/components/docs/doc-type-badge";
import { FileText } from "lucide-react";
import Link from "next/link";

export default async function DocsPage() {
  const workspaceId = await getDefaultWorkspaceId();
  const documents = await prisma.document.findMany({
    where: { project: { workspaceId } },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Docs</h1>
        <p className="mt-1 text-muted-foreground">
          Specs, notes, and documentation across all projects.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="glass-panel p-12 text-center text-muted-foreground">
          No documents yet. Create docs from within a project.
        </div>
      ) : (
        <div className="glass-panel divide-y divide-border/50">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`/projects/${doc.project.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{doc.title}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.project.name}
                </p>
              </div>
              <DocTypeBadge type={doc.type} />
              <span className="text-xs text-muted-foreground">
                {doc.updatedAt.toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

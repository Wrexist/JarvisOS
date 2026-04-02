"use client";

import { useState } from "react";
import { DocList } from "@/components/docs/doc-list";
import { DocEditor } from "@/components/docs/doc-editor";
import type { DocumentType } from "@/generated/prisma/client";

interface DocItem {
  id: string;
  title: string;
  type: DocumentType;
  updatedAt: string;
}

export function DocsView({
  documents,
  projectId,
  initialDocId,
}: {
  documents: DocItem[];
  projectId: string;
  initialDocId?: string;
}) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    initialDocId ?? null
  );

  if (selectedDocId) {
    return (
      <DocEditor
        documentId={selectedDocId}
        projectId={projectId}
        onBack={() => setSelectedDocId(null)}
      />
    );
  }

  return (
    <DocList
      documents={documents}
      projectId={projectId}
      onDocSelect={setSelectedDocId}
    />
  );
}

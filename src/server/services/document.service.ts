import { prisma } from "@/lib/prisma";
import type { DocumentType } from "@/generated/prisma/client";

export interface CreateDocumentInput {
  title: string;
  type: DocumentType;
  content?: string;
}

export async function listProjectDocuments(projectId: string) {
  return prisma.document.findMany({
    where: { projectId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getDocument(id: string, workspaceId?: string) {
  return prisma.document.findFirst({
    where: { id, ...(workspaceId && { project: { workspaceId } }) },
    include: { project: { select: { id: true, name: true } } },
  });
}

export async function createDocument(
  projectId: string,
  data: CreateDocumentInput
) {
  const doc = await prisma.document.create({
    data: {
      title: data.title,
      type: data.type,
      content: data.content ?? "",
      projectId,
    },
  });

  await prisma.activityEvent.create({
    data: {
      type: "document.created",
      message: `Document "${doc.title}" was created`,
      projectId,
    },
  });

  return doc;
}

export async function updateDocument(
  id: string,
  data: { title?: string; content?: string; type?: DocumentType },
  workspaceId?: string
) {
  if (workspaceId) {
    const exists = await prisma.document.findFirst({ where: { id, project: { workspaceId } } });
    if (!exists) throw new Error("Document not found");
  }
  return prisma.document.update({
    where: { id },
    data,
  });
}

export async function deleteDocument(id: string, workspaceId?: string) {
  if (workspaceId) {
    const exists = await prisma.document.findFirst({ where: { id, project: { workspaceId } } });
    if (!exists) throw new Error("Document not found");
  }
  const doc = await prisma.document.delete({ where: { id } });

  await prisma.activityEvent.create({
    data: {
      type: "document.deleted",
      message: `Document "${doc.title}" was deleted`,
      projectId: doc.projectId,
    },
  });
}

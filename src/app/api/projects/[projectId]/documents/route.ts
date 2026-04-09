import { NextResponse } from "next/server";
import {
  listProjectDocuments,
  createDocument,
} from "@/server/services/document.service";
import { requireAuth } from "@/lib/session";
import { validateBody, apiError } from "@/lib/api-utils";
import { createDocumentSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { projectId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId: auth.workspaceId },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const docs = await listProjectDocuments(projectId);
    return NextResponse.json(docs);
  } catch (error) {
    return apiError("Failed to list documents", error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { projectId } = await params;

    const projectExists = await prisma.project.findFirst({
      where: { id: projectId, workspaceId: auth.workspaceId },
      select: { id: true },
    });
    if (!projectExists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const data = await validateBody(request, createDocumentSchema);
    if (data instanceof NextResponse) return data;

    const doc = await createDocument(projectId, data);
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return apiError("Failed to create document", error);
  }
}

import { NextResponse } from "next/server";
import {
  listProjectDocuments,
  createDocument,
} from "@/server/services/document.service";
import { requireAuth } from "@/lib/session";
import { validateBody } from "@/lib/api-utils";
import { createDocumentSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { projectId } = await params;
    const docs = await listProjectDocuments(projectId);
    return NextResponse.json(docs);
  } catch (error) {
    console.error("Failed to list documents:", error);
    return NextResponse.json(
      { error: "Failed to list documents" },
      { status: 500 }
    );
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
    const data = await validateBody(request, createDocumentSchema);
    if (data instanceof NextResponse) return data;

    const doc = await createDocument(projectId, data);
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("Failed to create document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}

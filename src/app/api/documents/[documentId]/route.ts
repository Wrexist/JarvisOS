import { NextResponse } from "next/server";
import {
  getDocument,
  updateDocument,
  deleteDocument,
} from "@/server/services/document.service";
import { requireAuth } from "@/lib/session";
import { validateBody, apiError } from "@/lib/api-utils";
import { updateDocumentSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { documentId } = await params;
    const doc = await getDocument(documentId, auth.workspaceId);
    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(doc);
  } catch (error) {
    return apiError("Failed to get document", error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { documentId } = await params;
    const data = await validateBody(request, updateDocumentSchema);
    if (data instanceof NextResponse) return data;
    const doc = await updateDocument(documentId, data, auth.workspaceId);
    return NextResponse.json(doc);
  } catch (error) {
    return apiError("Failed to update document", error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { documentId } = await params;
    await deleteDocument(documentId, auth.workspaceId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError("Failed to delete document", error);
  }
}

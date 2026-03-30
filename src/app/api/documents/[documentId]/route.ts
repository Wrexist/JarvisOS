import { NextResponse } from "next/server";
import {
  getDocument,
  updateDocument,
  deleteDocument,
} from "@/server/services/document.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const doc = await getDocument(documentId);
    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(doc);
  } catch (error) {
    console.error("Failed to get document:", error);
    return NextResponse.json(
      { error: "Failed to get document" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const body = await request.json();
    const doc = await updateDocument(documentId, body);
    return NextResponse.json(doc);
  } catch (error) {
    console.error("Failed to update document:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    await deleteDocument(documentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}

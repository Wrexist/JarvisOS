import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  listProjectDocuments,
  createDocument,
} from "@/server/services/document.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const docs = await listProjectDocuments(projectId);
    return NextResponse.json(docs);
  } catch (error) {
    logger.error("Failed to list documents:", error);
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
    const { projectId } = await params;
    const body = await request.json();

    if (!body.title || !body.type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 }
      );
    }

    const doc = await createDocument(projectId, body);
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    logger.error("Failed to create document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}

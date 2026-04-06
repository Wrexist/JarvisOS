import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { validateBody } from "@/lib/api-utils";
import { updateTemplateSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { templateId } = await params;
    const template = await prisma.promptTemplate.findFirst({
      where: { id: templateId, workspaceId: auth.workspaceId },
    });
    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to get template:", error);
    return NextResponse.json(
      { error: "Failed to get template" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { templateId } = await params;
    const data = await validateBody(request, updateTemplateSchema);
    if (data instanceof NextResponse) return data;

    // Verify ownership
    const exists = await prisma.promptTemplate.findFirst({
      where: { id: templateId, workspaceId: auth.workspaceId },
    });
    if (!exists) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const template = await prisma.promptTemplate.update({
      where: { id: templateId },
      data,
    });
    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to update template:", error);
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { templateId } = await params;

    // Verify ownership
    const exists = await prisma.promptTemplate.findFirst({
      where: { id: templateId, workspaceId: auth.workspaceId },
    });
    if (!exists) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    await prisma.promptTemplate.delete({ where: { id: templateId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}

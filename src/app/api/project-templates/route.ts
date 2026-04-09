import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { validateBody } from "@/lib/api-utils";
import { createProjectTemplateSchema } from "@/lib/validations";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { workspaceId } = auth;
    const templates = await prisma.projectTemplate.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Failed to list templates:", error);
    return NextResponse.json(
      { error: "Failed to list templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;
    const { workspaceId } = auth;

    const data = await validateBody(request, createProjectTemplateSchema);
    if (data instanceof NextResponse) return data;

    const template = await prisma.projectTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        taskTemplates: data.taskTemplates ?? [],
        docTemplates: data.docTemplates ?? [],
        workspaceId,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Failed to create template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

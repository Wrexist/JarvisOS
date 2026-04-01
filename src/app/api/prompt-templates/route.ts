import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getSessionWorkspaceId } from "@/lib/session";

export async function GET() {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const templates = await prisma.promptTemplate.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(templates);
  } catch (error) {
    logger.error("Failed to list templates:", error);
    return NextResponse.json(
      { error: "Failed to list templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getSessionWorkspaceId();
    const body = await request.json();

    if (!body.name || !body.content) {
      return NextResponse.json(
        { error: "Name and content are required" },
        { status: 400 }
      );
    }

    const template = await prisma.promptTemplate.create({
      data: {
        name: body.name,
        description: body.description,
        content: body.content,
        workspaceId,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    logger.error("Failed to create template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

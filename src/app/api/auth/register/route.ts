import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-utils";

export async function POST(request: Request) {
  try {
    // Rate limit registration by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { allowed } = checkRateLimit(`register:${ip}`, { limit: 5, window: 60_000 });
    if (!allowed) return rateLimitResponse();

    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Normalize email to prevent duplicate accounts
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name || undefined,
        passwordHash,
      },
    });

    // Create a default workspace for the new user
    const slug = slugify(name || normalizedEmail.split("@")[0], {
      lower: true,
      strict: true,
    });

    await prisma.workspace.create({
      data: {
        name: name ? `${name}'s Workspace` : "My Workspace",
        slug: `${slug}-${Date.now()}`,
        ownerId: user.id,
      },
    });

    return NextResponse.json(
      { success: true, email: user.email },
      { status: 201 }
    );
  } catch (error) {
    return apiError("Registration failed", error);
  }
}

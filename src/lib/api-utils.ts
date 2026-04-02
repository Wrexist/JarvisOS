import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Validates request body against a Zod schema.
 * Returns typed data or a 400 NextResponse.
 */
export async function validateBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<T | NextResponse> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json(
        { error: "Validation failed", details },
        { status: 400 }
      );
    }

    return result.data;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}


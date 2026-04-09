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

/**
 * Builds a structured error response for API routes.
 * Logs full error details server-side and returns a JSON response
 * with enough context for debugging (error message, code, timestamp).
 */
export function apiError(
  context: string,
  error: unknown,
  status = 500
): NextResponse {
  const timestamp = new Date().toISOString();
  const message =
    error instanceof Error ? error.message : "Internal server error";
  const stack = error instanceof Error ? error.stack : undefined;

  // Full server-side log — visible in hosting logs / terminal
  console.error(
    JSON.stringify({
      error: context,
      message,
      stack,
      timestamp,
    })
  );

  // Client-facing response — enough detail to report, no stack traces
  return NextResponse.json(
    {
      error: message,
      context,
      timestamp,
    },
    { status }
  );
}


import { z } from "zod";

/**
 * Validated environment variables.
 * Fails fast at import time with a clear error listing all missing/invalid vars.
 */
const envSchema = z.object({
  // DATABASE_URL is optional in desktop mode (uses FORGEOS_DATA_DIR instead)
  DATABASE_URL: z.string().optional(),
  // NextAuth accepts AUTH_SECRET or NEXTAUTH_SECRET
  AUTH_SECRET: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_DEFAULT_MODEL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_PRIVATE_KEY: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  FORGEOS_DESKTOP: z.string().optional(),
  FORGEOS_DATA_DIR: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
}).refine(
  (data) => data.DATABASE_URL || data.FORGEOS_DESKTOP === "true",
  { message: "DATABASE_URL is required (unless FORGEOS_DESKTOP=true)" }
).refine(
  (data) => data.AUTH_SECRET || data.NEXTAUTH_SECRET,
  { message: "AUTH_SECRET or NEXTAUTH_SECRET is required" }
);

function validateEnv() {
  // Skip validation during build (no DB/auth needed for static analysis)
  if (process.env.NEXT_PHASE === "phase-production-build") return null;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    console.error(`\n❌ Invalid environment variables:\n${errors}\n`);
    throw new Error("Invalid environment variables");
  }
  return result.data;
}

export const env = validateEnv();

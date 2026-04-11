import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "@/lib/env"; // Validate environment variables on first import

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/* eslint-disable @typescript-eslint/no-require-imports */
function createDesktopPrismaClient(): PrismaClient {
  // Desktop mode: use PGlite (embedded PostgreSQL via WASM).
  // The Next.js child process creates its own PGlite instance pointing
  // to the data directory set by the Electron main process.
  const { PGlite } = require("@electric-sql/pglite");
  const pg = require("pg");

  const dataDir = process.env.FORGEOS_DATA_DIR!;
  const pglite = new PGlite(dataDir);

  function execQuery(
    configOrText: string | { text: string; values?: unknown[]; rowMode?: string },
    values?: unknown[]
  ) {
    let sql: string;
    let params: unknown[] | undefined;
    let rowMode: string | undefined;
    if (typeof configOrText === "string") {
      sql = configOrText;
      params = values;
    } else {
      sql = configOrText.text;
      params = configOrText.values ?? values;
      rowMode = configOrText.rowMode;
    }
    return pglite.query(sql, params).then((result: { rows: unknown[]; fields: { name: string; dataTypeID: number }[] }) => {
      let rows: unknown[];
      if (rowMode === "array") {
        const fieldNames = result.fields.map((f: { name: string }) => f.name);
        rows = result.rows.map((row: unknown) => {
          const obj = row as Record<string, unknown>;
          return fieldNames.map((name: string) => obj[name]);
        });
      } else {
        rows = result.rows;
      }
      return {
        rows,
        fields: result.fields.map((f: { name: string; dataTypeID: number }) => ({
          name: f.name,
          dataTypeID: f.dataTypeID,
        })),
        rowCount: result.rows.length,
      };
    });
  }

  // pg.Pool subclass wrapping PGlite — passes the instanceof check in PrismaPg
  class PGlitePool extends pg.Pool {
    constructor() {
      super({ max: 0 });
    }
    async query(
      configOrText: string | { text: string; values?: unknown[]; rowMode?: string },
      values?: unknown[]
    ) {
      return execQuery(configOrText, values);
    }
    async connect() {
      return {
        query: execQuery,
        release() {},
        on() { return this; },
        removeListener() { return this; },
      };
    }
    async end() {
      await pglite.close();
    }
  }

  const pool = new PGlitePool();
  // Cast needed: pg.Pool loaded via require() is untyped, but pool passes instanceof check at runtime
  const adapter = new PrismaPg(pool as InstanceType<typeof pg.Pool>);
  return new PrismaClient({ adapter });
}
/* eslint-enable @typescript-eslint/no-require-imports */

function createPrismaClient(): PrismaClient {
  if (process.env.FORGEOS_DESKTOP === "true") {
    return createDesktopPrismaClient();
  }
  // Web mode: standard PostgreSQL connection
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

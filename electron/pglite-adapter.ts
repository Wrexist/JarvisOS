/**
 * PGlite adapter that wraps a PGlite instance as a pg.Pool subclass.
 * This allows @prisma/adapter-pg to accept it via its `instanceof pg.Pool` check.
 *
 * PGlite is PostgreSQL compiled to WASM — full SQL compatibility, no external deps.
 */
import pg from "pg";
import { PGlite } from "@electric-sql/pglite";

/** Execute a query against PGlite, handling rowMode conversion. */
async function execQuery(
  db: PGlite,
  configOrText: string | { text: string; values?: unknown[]; rowMode?: string; types?: unknown },
  values?: unknown[]
): Promise<{ rows: unknown[]; fields: { name: string; dataTypeID: number }[]; rowCount: number }> {
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

  const result = await db.query(sql, params as unknown[]);

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
}

/**
 * A pg.Pool subclass backed by PGlite.
 * Passes the `instanceof pg.Pool` check required by @prisma/adapter-pg.
 *
 * We use `as any` for override returns because pg's types expect full
 * PoolClient/QueryResult objects, but Prisma's adapter only uses the
 * subset we provide (query, release, on, removeListener).
 */
export class PGlitePool extends pg.Pool {
  private db: PGlite;

  constructor(db: PGlite) {
    super({ max: 0 });
    this.db = db;
  }

  // @ts-expect-error — returns simplified result, Prisma only uses rows/fields/rowCount
  override async query(
    configOrText: string | { text: string; values?: unknown[]; rowMode?: string; types?: unknown },
    values?: unknown[]
  ) {
    return execQuery(this.db, configOrText, values);
  }

  // @ts-expect-error — returns simplified client, Prisma only uses query/release/on/removeListener
  override async connect() {
    const db = this.db;
    return {
      query(
        configOrText: string | { text: string; values?: unknown[]; rowMode?: string; types?: unknown },
        values?: unknown[]
      ) {
        return execQuery(db, configOrText, values);
      },
      release() {},
      on() { return this; },
      removeListener() { return this; },
    };
  }

  override async end(): Promise<void> {
    await this.db.close();
  }
}

let pgliteInstance: PGlite | null = null;

/** Initialize PGlite with a filesystem-backed data directory. */
export async function initPGlite(dataDir: string): Promise<PGlite> {
  if (pgliteInstance) return pgliteInstance;
  pgliteInstance = new PGlite(dataDir);
  await pgliteInstance.ready;
  return pgliteInstance;
}

/** Create a PGlitePool wrapping the initialized PGlite instance. */
export function createPGlitePool(db: PGlite): PGlitePool {
  return new PGlitePool(db);
}

/** Get the current PGlite instance. */
export function getPGliteInstance(): PGlite | null {
  return pgliteInstance;
}

/** Shut down the PGlite instance. */
export async function closePGlite(): Promise<void> {
  if (pgliteInstance) {
    await pgliteInstance.close();
    pgliteInstance = null;
  }
}

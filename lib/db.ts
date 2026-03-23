import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Lazy singleton — initialized on first use, not at module load time.
// This lets Next.js build without DATABASE_URL present.
let _sql: NeonQueryFunction<false, false> | null = null;

function getDb(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required. Copy .env.example to .env.local");
  }
  _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

// Tagged-template proxy — use as: sql`SELECT ...`
export const sql = new Proxy({} as NeonQueryFunction<false, false>, {
  apply(_target, _thisArg, args) {
    const db = getDb();
    return (db as unknown as (...a: unknown[]) => unknown)(...args);
  },
  get(_target, prop) {
    const db = getDb();
    return (db as unknown as Record<string | symbol, unknown>)[prop];
  },
}) as NeonQueryFunction<false, false>;

/**
 * Run a dynamic SQL query (non-template-literal form).
 * Use this when you need to build queries programmatically.
 * Returns rows as an array of plain objects.
 */
export async function rawQuery<T = Record<string, unknown>>(
  queryStr: string,
  params: unknown[] = []
): Promise<T[]> {
  // neon() supports being called as a regular function: sql(queryString, params)
  const result = await (sql as unknown as (q: string, p: unknown[]) => Promise<T[]>)(queryStr, params);
  return result;
}

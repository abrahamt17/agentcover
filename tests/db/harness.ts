import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = path.resolve(__dirname, "../..");
const migrationsDir = path.join(root, "supabase/migrations");

/** Boots an in-memory Postgres, applies the Supabase shim and every real migration file. */
export async function createTestDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(readFileSync(path.join(__dirname, "supabase-shim.sql"), "utf8"));
  for (const file of readdirSync(migrationsDir).sort()) {
    if (file.endsWith(".sql")) {
      await db.exec(readFileSync(path.join(migrationsDir, file), "utf8"));
    }
  }
  return db;
}

export async function createUser(
  db: PGlite,
  email: string,
  options: { metadata?: Record<string, unknown>; confirmed?: boolean } = {},
): Promise<string> {
  const result = await db.query<{ id: string }>(
    `insert into auth.users (email, raw_user_meta_data, email_confirmed_at)
     values ($1, $2, $3) returning id`,
    [email, JSON.stringify(options.metadata ?? {}), options.confirmed === false ? null : new Date().toISOString()],
  );
  return result.rows[0].id;
}

/**
 * Runs `fn` exactly as the Supabase API would for a signed-in user:
 * role `authenticated` with the user's id in the JWT claims (or role `anon` when userId is null).
 */
export async function as<T>(db: PGlite, userId: string | null, fn: () => Promise<T>): Promise<T> {
  const claims = userId ? JSON.stringify({ sub: userId, role: "authenticated" }) : "";
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [claims]);
  await db.exec(`set role ${userId ? "authenticated" : "anon"}`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role`);
    await db.query(`select set_config('request.jwt.claims', '', false)`);
  }
}

export async function rows<T = Record<string, unknown>>(db: PGlite, sql: string, params: unknown[] = []): Promise<T[]> {
  return (await db.query<T>(sql, params)).rows;
}

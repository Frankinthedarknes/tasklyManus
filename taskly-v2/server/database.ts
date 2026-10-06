import { mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Pool } from "pg";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { sql } from "drizzle-orm";
import type { Config } from "./config";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema> | PgliteDatabase<typeof schema>;
export type DatabaseHandle = { db: Database; close: () => Promise<void>; kind: "postgres" | "pglite" };

export async function openDatabase(config: Config): Promise<DatabaseHandle> {
  if (config.databaseUrl) {
    const connection = new URL(config.databaseUrl);
    // node-postgres puede reemplazar ssl a partir de los parámetros de la URL.
    // En producción eliminamos sslmode y exigimos verificación del certificado.
    if (config.environment === "production") connection.searchParams.delete("sslmode");
    const pool = new Pool({
      connectionString: connection.toString(),
      max: 10,
      connectionTimeoutMillis: 10_000,
      ...(config.environment === "production" ? { ssl: { rejectUnauthorized: true } } : {})
    });
    pool.on("error", () => console.error("La conexión PostgreSQL se interrumpió."));
    return { db: drizzlePg(pool, { schema }), close: () => pool.end(), kind: "postgres" };
  }
  if (config.environment === "production") throw new Error("PGlite está limitado a desarrollo y tests.");
  const { PGlite } = await import("@electric-sql/pglite");
  await mkdir(config.dataDir, { recursive: true, mode: 0o700 });
  const client = new PGlite(config.dataDir);
  await client.waitReady;
  return { db: drizzlePglite(client, { schema }), close: () => client.close(), kind: "pglite" };
}

export async function migrate(db: Database, migrationPath = "migrations/0001_auth.sql") {
  const source = await readFile(migrationPath, "utf8");
  const checksum = createHash("sha256").update(source).digest("hex");
  const statements = source.split(/\n--> statement-breakpoint\n/).map(value => value.trim()).filter(Boolean);
  await db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(726241001)`);
    await tx.execute(sql`create table if not exists taskly_migrations (version integer primary key, checksum text not null, applied_at timestamptz not null default now())`);
    const result = await tx.execute(sql`select checksum from taskly_migrations where version = 1`);
    if (result.rows.length) {
      if (result.rows[0].checksum !== checksum) throw new Error("La migración aplicada fue modificada. Crea una migración nueva.");
      return;
    }
    for (const statement of statements) await tx.execute(sql.raw(statement));
    await tx.execute(sql`insert into taskly_migrations(version, checksum) values (1, ${checksum})`);
  });
}

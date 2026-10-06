import { resolve } from "node:path";

export type Config = {
  environment: "development" | "test" | "production";
  port: number;
  origin: string;
  secret: string;
  databaseUrl?: string;
  dataDir: string;
};

export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const environment = env.NODE_ENV ?? "development";
  if (!["development", "test", "production"].includes(environment)) throw new Error("NODE_ENV no válido.");
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT no válido.");
  let origin: URL;
  try { origin = new URL(env.APP_ORIGIN ?? "http://localhost:5173"); }
  catch { throw new Error("APP_ORIGIN no válido."); }
  if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) {
    throw new Error("APP_ORIGIN debe ser un origen HTTP(S), sin rutas ni credenciales.");
  }
  const secret = env.BETTER_AUTH_SECRET ?? "";
  if (secret.length < 43 || new Set(secret).size < 16 || /example|change.?me|placeholder|better-auth-secret/i.test(secret)) {
    throw new Error("Falta un secreto aleatorio válido. Para pruebas locales ejecuta npm run setup.");
  }
  const databaseUrl = env.DATABASE_URL?.trim() || undefined;
  if (databaseUrl) {
    let database: URL;
    try { database = new URL(databaseUrl); }
    catch { throw new Error("DATABASE_URL no válido."); }
    if (!["postgres:", "postgresql:"].includes(database.protocol) || !database.hostname || database.pathname === "/") {
      throw new Error("DATABASE_URL debe apuntar a una base PostgreSQL.");
    }
    if (environment === "production") {
      const mode = database.searchParams.get("sslmode");
      if (mode && !["require", "verify-full", "verify-ca"].includes(mode)) throw new Error("Producción requiere TLS con certificado verificado.");
      if (database.searchParams.has("ssl") || database.searchParams.has("sslcert") || database.searchParams.has("sslkey") || database.searchParams.has("sslrootcert")) {
        throw new Error("No se admiten parámetros TLS que sobrescriban la verificación del certificado.");
      }
    }
  }
  if (environment === "production" && (!databaseUrl || origin.protocol !== "https:")) {
    throw new Error("Producción requiere PostgreSQL externo y APP_ORIGIN HTTPS.");
  }
  return { environment: environment as Config["environment"], port, origin: origin.origin, secret, databaseUrl, dataDir: resolve(env.DATA_DIR ?? "./data/dev") };
}

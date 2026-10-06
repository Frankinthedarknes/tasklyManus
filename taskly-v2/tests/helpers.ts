import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { request as httpRequest, type IncomingHttpHeaders } from "node:http";
import type { AddressInfo } from "node:net";
import { Pool } from "pg";
import { readConfig, type Config } from "../server/config";
import { createApplication } from "../server/app";
import { openDatabase, migrate } from "../server/database";

let clientNumber = 10;
export const PASSWORD = "una frase de prueba larga 2048";

export type Result = { status: number; headers: IncomingHttpHeaders; body: Record<string, any>; text: string };

export class Client {
  cookie = "";
  readonly localAddress = `127.0.0.${clientNumber++}`;
  constructor(readonly base: string, readonly origin: string) {}
  async send(path: string, options: { method?: string; body?: unknown; headers?: Record<string, string>; raw?: string; chunked?: boolean } = {}): Promise<Result> {
    const method = options.method ?? "GET";
    const content = options.raw ?? (options.body === undefined ? undefined : JSON.stringify(options.body));
    const headers: Record<string, string> = {
      ...(content === undefined ? {} : { "content-type": "application/json", ...(!options.chunked ? { "content-length": String(Buffer.byteLength(content)) } : {}) }),
      ...(method === "GET" ? {} : { origin: this.origin }),
      ...(this.cookie ? { cookie: this.cookie } : {}), ...options.headers
    };
    return await new Promise((resolve, reject) => {
      const req = httpRequest(new URL(path, this.base), { method, headers, localAddress: this.localAddress }, response => {
        const chunks: Buffer[] = [];
        response.on("data", chunk => chunks.push(Buffer.from(chunk)));
        response.on("end", () => {
          for (const value of response.headers["set-cookie"] ?? []) {
            const pair = value.split(";")[0];
            if (/^(?:__Secure-)?taskly2_session=/.test(pair)) this.cookie = /Max-Age=0/.test(value) ? "" : pair;
          }
          const text = Buffer.concat(chunks).toString("utf8");
          let body: Record<string, any> = {};
          try { body = JSON.parse(text); } catch { /* HTML/module responses are inspected as text. */ }
          resolve({ status: response.statusCode ?? 0, headers: response.headers, body, text });
        });
        response.on("error", reject);
      });
      req.on("error", reject);
      if (content !== undefined) {
        if (options.chunked) { req.write(content.slice(0, 8192)); req.write(content.slice(8192)); }
        else req.write(content);
      }
      req.end();
    });
  }
  signUp(email: string, name = "Persona Prueba", password = PASSWORD) { return this.send("/api/auth/sign-up/email", { method: "POST", body: { email, name, password } }); }
  signIn(email: string, password = PASSWORD) { return this.send("/api/auth/sign-in/email", { method: "POST", body: { email, password } }); }
  async account(email = `${randomUUID()}@example.test`, name = "Persona Prueba") {
    const registration = await this.signUp(email, name);
    if (registration.status !== 200) throw new Error(`El registro de prueba falló: ${registration.status}`);
    const login = await this.signIn(email);
    if (login.status !== 200) throw new Error(`El inicio de sesión de prueba falló: ${login.status}`);
    const result = await this.send("/api/profile");
    if (result.status !== 200) throw new Error(`No se pudo leer el perfil: ${result.status}`);
    return result.body.profile as { id: string; name: string; email: string; city: string; bio: string; emailVerified: boolean };
  }
}

export async function fixture(options: { dataDir?: string; embedded?: boolean; config?: Config } = {}) {
  const temporary = options.dataDir ? undefined : await mkdtemp(join(tmpdir(), "taskly-api-test-"));
  const dataDir = options.dataDir ?? temporary!;
  let control: Pool | undefined;
  let namespace: string | undefined;
  let databaseUrl = options.embedded ? undefined : process.env.TASKLY_TEST_DATABASE_URL;
  // Una base externa solo se habilita con esta variable exclusiva de tests.
  // Cada fixture usa su propio esquema nuevo; nunca se vacían tablas existentes.
  if (databaseUrl) {
    namespace = `taskly_test_${randomUUID().replaceAll("-", "")}`;
    control = new Pool({ connectionString: databaseUrl });
    await control.query(`create schema "${namespace}"`);
    const url = new URL(databaseUrl);
    url.searchParams.set("options", `-c search_path=${namespace}`);
    databaseUrl = url.toString();
  }
  const config = options.config ?? readConfig({
    NODE_ENV: "test", PORT: "3000", APP_ORIGIN: "http://localhost:5173", DATA_DIR: dataDir,
    DATABASE_URL: databaseUrl ?? "", BETTER_AUTH_SECRET: randomBytes(48).toString("base64url")
  });
  const database = await openDatabase(config);
  await migrate(database.db);
  const { app, auth } = createApplication(database.db, config);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => { server.once("listening", resolve); server.once("error", reject); });
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    ...database, config, auth, base,
    client: () => new Client(base, config.origin),
    close: async () => {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      await database.close();
      if (control && namespace) { await control.query(`drop schema "${namespace}" cascade`); await control.end(); }
      if (temporary) await rm(temporary, { recursive: true, force: true });
    }
  };
}

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql, eq } from "drizzle-orm";
import { verify } from "@node-rs/argon2";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fixture, PASSWORD, Client } from "./helpers";
import { account, profile, session, user } from "../server/schema";
import { migrate } from "../server/database";
import { createAuth } from "../server/auth";

type Fixture = Awaited<ReturnType<typeof fixture>>;
const validProfile = { name: "Perfil Editado", city: "Medellín", bio: "Puedo ayudar con reparaciones." };

describe("Cuentas y perfiles con HTTP y SQL reales", () => {
  let service: Fixture;
  beforeAll(async () => { service = await fixture(); });
  afterAll(async () => { if (service) await service.close(); });

  it("guarda Argon2id con sales distintas y la base rechaza texto plano", async () => {
    const first = service.client(), second = service.client();
    const a = await first.account(), b = await second.account();
    const [one] = await service.db.select().from(account).where(eq(account.userId, a.id));
    const [two] = await service.db.select().from(account).where(eq(account.userId, b.id));
    expect(one.password).toMatch(/^\$argon2id\$v=19\$m=65536,t=3,p=1\$/);
    expect(one.password).not.toBe(two.password);
    expect(await verify(one.password!, PASSWORD)).toBe(true);
    expect(await verify(one.password!, "otra contraseña incorrecta")).toBe(false);
    await expect(service.db.update(account).set({ password: PASSWORD }).where(eq(account.id, one.id))).rejects.toThrow();
    const [unchanged] = await service.db.select().from(account).where(eq(account.id, one.id));
    expect(unchanged.password).toBe(one.password);
    expect((await first.send("/api/profile")).text).not.toContain(one.password!);
  });

  it("normaliza el correo y evita revelar o reemplazar cuentas en un registro duplicado", async () => {
    const client = service.client();
    const email = `${randomUUID()}@example.test`;
    expect((await client.signUp(`  ${email.toUpperCase()}  `, "Nombre Original")).body).toEqual({ ok: true });
    expect(client.cookie).toBe("");
    const repeated = await client.signUp(email, "Nombre Sustituto", "otra frase para otra persona");
    expect(repeated.status).toBe(200);
    expect(repeated.body).toEqual({ ok: true });
    expect((await client.signIn(email)).status).toBe(200);
    const current = (await client.send("/api/profile")).body.profile;
    expect(current.name).toBe("Nombre Original");
    expect(current.email).toBe(email);
    expect(current.emailVerified).toBe(false);
    expect((await client.signIn(email, "otra frase para otra persona")).status).toBe(401);
  });

  it("rechaza datos y campos de permisos en registro y login", async () => {
    const client = service.client();
    const email = `${randomUUID()}@example.test`;
    for (const body of [
      { name: "A", email, password: PASSWORD },
      { name: "Persona", email: "invalid", password: PASSWORD },
      { name: "Persona", email, password: "short" },
      { name: "Persona", email, password: PASSWORD, role: "admin" },
      { name: "Persona", email, password: PASSWORD, emailVerified: true }
    ]) expect((await client.send("/api/auth/sign-up/email", { method: "POST", body })).status).toBe(400);
    const existing = await service.db.select().from(user).where(eq(user.email, email));
    expect(existing).toHaveLength(0);
    expect((await client.send("/api/auth/sign-in/email", { method: "POST", body: { email, password: PASSWORD, userId: "other" } })).status).toBe(400);
  });

  it("login incorrecto no revela si existe el correo ni entrega tokens", async () => {
    const client = service.client();
    const email = `${randomUUID()}@example.test`;
    await client.signUp(email);
    const wrong = await client.signIn(email, "contraseña incorrecta"), missing = await client.signIn(`${randomUUID()}@example.test`);
    expect(wrong.status).toBe(401); expect(missing.status).toBe(401);
    expect(wrong.body.error).toBe(missing.body.error);
    expect(client.cookie).toBe("");
    const success = await client.signIn(email);
    expect(success.body).toEqual({ ok: true });
    expect(success.headers["set-auth-token"]).toBeUndefined();
    expect(success.text).not.toContain("token");
  });

  it("usa cookie HttpOnly, SameSite, duración fija y Secure en producción", async () => {
    const client = service.client();
    await client.signUp(`${client.localAddress}@example.test`);
    const result = await client.signIn(`${client.localAddress}@example.test`);
    const cookie = result.headers["set-cookie"]!.find(value => value.startsWith("taskly2_session="))!;
    expect(cookie).toContain("HttpOnly"); expect(cookie).toContain("SameSite=Lax"); expect(cookie).toContain("Path=/"); expect(cookie).toContain("Max-Age=604800");
    const production = createAuth(service.db, { ...service.config, environment: "production", origin: "https://taskly.example" });
    const context = await production.$context;
    expect(context.authCookies.sessionToken.name).toBe("__Secure-taskly2_session");
    expect(context.authCookies.sessionToken.attributes.secure).toBe(true);
    expect(context.authCookies.sessionToken.attributes.httpOnly).toBe(true);
    const current = (await client.send("/api/profile")).body.profile;
    const [before] = await service.db.select().from(session).where(eq(session.userId, current.id));
    await client.send("/api/profile");
    const [after] = await service.db.select().from(session).where(eq(session.id, before.id));
    expect(after.expiresAt.toISOString()).toBe(before.expiresAt.toISOString());
  });

  it("persiste el perfil del actor y mantiene aislada la segunda cuenta", async () => {
    const a = service.client(), b = service.client();
    const one = await a.account(), two = await b.account();
    expect((await a.send("/api/profile", { method: "PATCH", body: validProfile })).status).toBe(200);
    expect((await a.send("/api/profile")).body.profile).toMatchObject(validProfile);
    expect((await b.send("/api/profile")).body.profile).toMatchObject({ id: two.id, name: two.name, city: "", bio: "" });
    for (const field of ["id", "userId", "role", "email", "emailVerified"]) {
      expect((await a.send("/api/profile", { method: "PATCH", body: { ...validProfile, [field]: field === "emailVerified" ? true : two.id } })).status).toBe(400);
    }
    const [row] = await service.db.select().from(profile).where(eq(profile.userId, one.id));
    expect(row).toMatchObject({ city: "Medellín", bio: validProfile.bio });
    expect((await b.send("/api/profile")).body.profile.name).toBe(two.name);
    const dto = (await a.send("/api/profile")).body.profile;
    expect(Object.keys(dto).sort()).toEqual(["bio", "city", "email", "emailVerified", "id", "joinedAt", "name"].sort());
  });

  it("rechaza perfiles inválidos sin cambiar los datos guardados", async () => {
    const client = service.client(); await client.account();
    await client.send("/api/profile", { method: "PATCH", body: validProfile });
    for (const value of [
      { ...validProfile, name: " " }, { ...validProfile, name: "A".repeat(81) },
      { ...validProfile, city: "X".repeat(101) }, { ...validProfile, bio: "B".repeat(501) },
      { ...validProfile, city: 123 }, { name: "Otro Nombre" }
    ]) expect((await client.send("/api/profile", { method: "PATCH", body: value })).status).toBe(400);
    expect((await client.send("/api/profile")).body.profile).toMatchObject(validProfile);
  });

  it("revierte el cambio de nombre si falla la escritura del perfil", async () => {
    const client = service.client(); const person = await client.account();
    await service.db.execute(sql`alter table profile add constraint profile_test_failure check (city <> 'ROLLBACK_TEST')`);
    try {
      const response = await client.send("/api/profile", { method: "PATCH", body: { ...validProfile, city: "ROLLBACK_TEST" } });
      expect(response.status).toBe(500);
      expect(response.text).not.toContain("ROLLBACK_TEST");
      expect(response.text).not.toContain("constraint");
      expect(response.body.requestId).toMatch(/^[\w-]+$/);
      expect((await client.send("/api/profile")).body.profile.name).toBe(person.name);
      const [saved] = await service.db.select().from(user).where(eq(user.id, person.id));
      expect(saved.name).toBe(person.name);
    } finally { await service.db.execute(sql`alter table profile drop constraint profile_test_failure`); }
  });

  it("bloquea cookies falsas, sesiones vencidas y acceso sin sesión", async () => {
    const empty = service.client();
    expect((await empty.send("/api/profile")).status).toBe(401);
    expect((await empty.send("/api/profile", { method: "PATCH", body: validProfile })).status).toBe(401);
    expect((await empty.send("/api/profile", { headers: { cookie: "taskly2_session=forged" } })).status).toBe(401);
    const client = service.client(); const person = await client.account();
    await service.db.update(session).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(session.userId, person.id));
    expect((await client.send("/api/profile")).status).toBe(401);
  });

  it("logout revoca en SQL incluso si se vuelve a usar la cookie anterior", async () => {
    const client = service.client(); const person = await client.account(); const oldCookie = client.cookie;
    const other = service.client(); expect((await other.signIn(person.email)).status).toBe(200);
    expect((await client.send("/api/auth/sign-out", { method: "POST", body: {} })).status).toBe(200);
    expect(client.cookie).toBe("");
    expect((await client.send("/api/profile", { headers: { cookie: oldCookie } })).status).toBe(401);
    expect((await other.send("/api/profile")).status).toBe(200);
    const sessions = await service.db.select().from(session).where(eq(session.userId, person.id));
    expect(sessions).toHaveLength(1);
  });

  it("rechaza escrituras sin origen, desde otro origen y con tipos de cuerpo incorrectos", async () => {
    const client = service.client(); await client.account();
    for (const path of ["/api/profile", "/api/auth/sign-out"]) {
      for (const origin of ["", "https://attacker.example", "http://127.0.0.1:5173"]) {
        expect((await client.send(path, { method: path.includes("profile") ? "PATCH" : "POST", body: path.includes("profile") ? validProfile : {}, headers: { origin } })).status).toBe(403);
      }
    }
    expect((await client.send("/api/profile", { method: "PATCH", raw: JSON.stringify(validProfile), headers: { "content-type": "text/plain" } })).status).toBe(415);
    expect((await client.send("/api/profile", { method: "PATCH", raw: "{invalid" })).status).toBe(400);
    expect((await client.send("/api/profile")).headers["cache-control"]).toBe("no-store");
    expect((await client.send("/api/profile")).status).toBe(200);
  });

  it("limita registros y login aunque se falsifiquen encabezados de IP", async () => {
    const client = service.client();
    for (let i = 0; i < 11; i++) {
      const result = await client.send("/api/auth/sign-in/email", {
        method: "POST", body: { email: "missing@example.test", password: PASSWORD },
        headers: { "x-taskly-client-ip": `192.0.2.${i + 1}`, "x-forwarded-for": `198.51.100.${i + 1}`, "cf-connecting-ip": `203.0.113.${i + 1}` }
      });
      expect(result.status).toBe(i === 10 ? 429 : 401);
      if (i === 10) expect(Number(result.headers["retry-after"])).toBeGreaterThan(0);
    }
    const registrations = service.client();
    for (let i = 0; i < 6; i++) expect((await registrations.signUp(`${randomUUID()}@example.test`)).status).toBe(i === 5 ? 429 : 200);
  });

  it("rechaza cuerpos grandes con Content-Length y con transferencia por chunks", async () => {
    const client = service.client(); await client.account();
    for (const path of ["/api/profile", "/api/auth/sign-in/email"]) {
      for (const chunked of [false, true]) {
        const result = await client.send(path, { method: path.includes("profile") ? "PATCH" : "POST", raw: JSON.stringify({ bio: "X".repeat(20_000) }), chunked });
        expect(result.status).toBe(413);
        expect(result.text).not.toContain("XXXXX");
      }
    }
    expect((await client.send("/api/profile")).status).toBe(200);
  });

  it("mantiene cerradas rutas no implementadas y verifica migraciones sin reaplicarlas", async () => {
    const client = service.client(); await client.account();
    for (const path of ["/get-session", "/request-password-reset", "/reset-password", "/change-password", "/send-verification-email", "/update-user", "/sign-in/social", "/delete-user"]) {
      expect((await client.send("/api/auth" + path, { method: "POST", body: {} })).status).toBe(404);
    }
    await migrate(service.db);
    const result = await service.db.execute(sql`select version from taskly_migrations`);
    expect(result.rows).toHaveLength(1);
    const directory = await mkdtemp(join(tmpdir(), "taskly-migration-test-"));
    try {
      const edited = join(directory, "edited.sql");
      await writeFile(edited, (await readFile("migrations/0001_auth.sql", "utf8")) + "\n-- unexpected edit\n");
      await expect(migrate(service.db, edited)).rejects.toThrow("modificada");
      expect((await client.send("/api/profile")).status).toBe(200);
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});

it("recupera sesión y perfil tras reiniciar y crear una carpeta de datos nueva", async () => {
  const root = await mkdtemp(join(tmpdir(), "taskly-restart-test-"));
  const dataDir = join(root, "new", "nested", "database");
  const secret = randomBytes(48).toString("base64url");
  const config = { environment: "test" as const, port: 3000, origin: "http://localhost:5173", secret, dataDir };
  let running: Fixture | undefined;
  try {
    running = await fixture({ config, dataDir, embedded: true });
    const first = running.client(); const person = await first.account();
    await first.send("/api/profile", { method: "PATCH", body: validProfile });
    const cookie = first.cookie;
    await running.close(); running = undefined;
    running = await fixture({ config, dataDir, embedded: true });
    const second = new Client(running.base, config.origin); second.cookie = cookie;
    expect((await second.send("/api/profile")).body.profile).toMatchObject({ ...validProfile, id: person.id });
    expect((await second.send("/api/auth/sign-out", { method: "POST", body: {} })).status).toBe(200);
    expect((await second.send("/api/profile", { headers: { cookie } })).status).toBe(401);
  } finally { if (running) await running.close(); await rm(root, { recursive: true, force: true }); }
});

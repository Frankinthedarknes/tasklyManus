import express, { type ErrorRequestHandler, type Request, type Response } from "express";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { eq, sql } from "drizzle-orm";
import { getRequest, setResponse } from "better-call/node";
import { fromNodeHeaders } from "better-auth/node";
import { z } from "zod";
import { profileInput, signInInput, signUpInput, type Profile } from "../shared/contracts";
import { createAuth } from "./auth";
import type { Config } from "./config";
import type { Database } from "./database";
import { user, profile } from "./schema";

const BODY_LIMIT = 16 * 1024;
const emptyInput = z.object({}).strict();
const authInputs = new Map<string, z.ZodType>([
  ["/api/auth/sign-up/email", signUpInput],
  ["/api/auth/sign-in/email", signInInput],
  ["/api/auth/sign-out", emptyInput]
]);

function errorMessage(status: number): string {
  if (status === 401) return "El correo o la contraseña no son correctos, o tu sesión ya terminó.";
  if (status === 403) return "No se pudo autorizar esta solicitud.";
  if (status === 413) return "La solicitud es demasiado grande.";
  if (status === 429) return "Has hecho varios intentos. Espera un minuto y vuelve a probar.";
  if (status >= 500) return "No se pudo completar la solicitud. Inténtalo de nuevo.";
  return "Revisa los datos e inténtalo de nuevo.";
}

export function createApplication(db: Database, config: Config, options: { clientDir?: string } = {}) {
  const app = express();
  const auth = createAuth(db, config);
  app.disable("x-powered-by");
  app.set("trust proxy", false);
  app.use(helmet({ contentSecurityPolicy: config.environment === "production" ? undefined : false }));
  app.use((req, res, next) => {
    res.locals.requestId = randomUUID();
    res.setHeader("X-Request-Id", res.locals.requestId);
    next();
  });
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      if (req.get("origin") !== config.origin) { res.status(403).json({ error: errorMessage(403) }); return; }
      if (!req.is("application/json")) { res.status(415).json({ error: "La solicitud debe usar JSON." }); return; }
      if (Number(req.get("content-length") ?? 0) > BODY_LIMIT) { res.status(413).json({ error: errorMessage(413) }); return; }
    }
    next();
  });

  app.get("/api/health", async (_req, res) => {
    await db.execute(sql`select 1`);
    res.json({ ok: true });
  });

  // Publicamos exclusivamente los tres flujos implementados. Las demás rutas
  // de la librería (reset, email, OAuth, cambio de contraseña...) quedan cerradas.
  app.use("/api/auth", async (req, res) => {
    const input = authInputs.get(req.originalUrl.split("?")[0]);
    if (req.method !== "POST" || !input) { res.status(404).json({ error: "Ruta no disponible." }); return; }
    const incoming = getRequest({ request: req, base: config.origin, bodySizeLimit: BODY_LIMIT });
    const parsed = input.safeParse(await incoming.json());
    if (!parsed.success) { res.status(400).json({ error: "Revisa los datos. El nombre y el correo deben ser válidos; la contraseña nueva necesita entre 12 y 128 caracteres." }); return; }
    const headers = new Headers(incoming.headers);
    headers.delete("content-length");
    headers.delete("transfer-encoding");
    // Nunca confiamos en IPs enviadas por el cliente. El proxy de producción
    // necesitará su propia configuración antes de habilitar usuarios reales.
    headers.set("x-taskly-client-ip", req.socket.remoteAddress ?? "127.0.0.1");
    const response = await auth.handler(new Request(incoming.url, { method: "POST", headers, body: JSON.stringify(parsed.data) }));
    const safeHeaders = new Headers({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    for (const cookie of response.headers.getSetCookie()) safeHeaders.append("set-cookie", cookie);
    const retry = response.headers.get("retry-after") ?? response.headers.get("x-retry-after");
    if (retry) safeHeaders.set("retry-after", retry);
    await response.body?.cancel();
    // Better Auth devuelve un token en ciertos cuerpos. El navegador solo
    // recibe la cookie HttpOnly y un resultado mínimo, sin token accesible a JS.
    await setResponse(res, new Response(JSON.stringify(response.ok ? { ok: true } : { error: errorMessage(response.status) }), {
      status: response.status, headers: safeHeaders
    }));
  });

  app.use("/api", express.json({ limit: BODY_LIMIT, strict: true }));

  async function currentProfile(id: string): Promise<Profile> {
    const [row] = await db.select({
      id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified,
      createdAt: user.createdAt, city: profile.city, bio: profile.bio
    }).from(user).leftJoin(profile, eq(profile.userId, user.id)).where(eq(user.id, id));
    if (!row) throw new Error("El usuario autenticado no existe.");
    return { id: row.id, name: row.name, email: row.email, emailVerified: row.emailVerified,
      joinedAt: row.createdAt.toISOString(), city: row.city ?? "", bio: row.bio ?? "" };
  }

  async function authenticatedId(req: Request, res: Response): Promise<string | undefined> {
    const current = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!current) { res.status(401).json({ error: "Tu sesión terminó. Vuelve a entrar." }); return; }
    return current.user.id;
  }

  app.get("/api/profile", async (req, res) => {
    const id = await authenticatedId(req, res);
    if (id) res.json({ profile: await currentProfile(id) });
  });
  app.patch("/api/profile", async (req, res) => {
    const id = await authenticatedId(req, res);
    if (!id) return;
    const parsed = profileInput.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Revisa el nombre (2–80), la ciudad (hasta 100) y la presentación (hasta 500 caracteres)." }); return; }
    const { name, city, bio } = parsed.data;
    await db.transaction(async tx => {
      await tx.update(user).set({ name, updatedAt: new Date() }).where(eq(user.id, id));
      await tx.insert(profile).values({ userId: id, city, bio }).onConflictDoUpdate({
        target: profile.userId, set: { city, bio, updatedAt: new Date() }
      });
    });
    res.json({ profile: await currentProfile(id) });
  });

  app.use("/api", (_req, res) => res.status(404).json({ error: "Ruta no disponible." }));
  if (options.clientDir) {
    const clientDir = resolve(options.clientDir);
    app.use(express.static(clientDir));
    app.get("/{*path}", (_req, res) => res.sendFile(resolve(clientDir, "index.html")));
  }
  const handleError: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    if (res.headersSent) { res.end(); return; }
    const detail = error as { status?: unknown; statusCode?: unknown; type?: string; message?: string };
    let status = typeof detail?.statusCode === "number" ? detail.statusCode : typeof detail?.status === "number" ? detail.status : 500;
    if (detail?.type === "entity.too.large" || /request body size exceeded|only accept up to/.test(detail?.message ?? "")) status = 413;
    else if (error instanceof SyntaxError) status = 400;
    if (status < 400 || status > 599) status = 500;
    if (status >= 500) console.error("Solicitud fallida", { requestId: res.locals.requestId });
    // No registramos contraseñas, URLs de conexión, cookies ni cuerpos completos.
    res.status(status).json({ error: errorMessage(status), requestId: res.locals.requestId });
  };
  app.use(handleError);
  return { app, auth };
}

import { describe, it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import { readConfig } from "../server/config";

const secret = randomBytes(48).toString("base64url");
const base = { BETTER_AUTH_SECRET: secret };

describe("Configuración que falla antes de iniciar un entorno inseguro", () => {
  it("rechaza secretos vacíos, repetidos y de ejemplo", () => {
    for (const value of ["", "short", "x".repeat(64), "example-" + secret]) expect(() => readConfig({ ...base, BETTER_AUTH_SECRET: value })).toThrow();
    expect(readConfig(base).secret).toBe(secret);
  });
  it("rechaza origen inválido, rutas, credenciales, puertos y ambientes desconocidos", () => {
    for (const origin of ["file:///tmp/test", "https://x.test/path", "https://name:password@x.test", "https://x.test?q=1"]) expect(() => readConfig({ ...base, APP_ORIGIN: origin })).toThrow();
    for (const port of ["0", "65536", "3000.5", "wat"]) expect(() => readConfig({ ...base, PORT: port })).toThrow();
    expect(() => readConfig({ ...base, NODE_ENV: "unknown" })).toThrow();
  });
  it("producción exige HTTPS, base externa y verificación TLS", () => {
    const production = { ...base, NODE_ENV: "production", APP_ORIGIN: "https://taskly.example", DATABASE_URL: "postgresql://test:unused@database.example/taskly" };
    expect(readConfig(production).environment).toBe("production");
    expect(() => readConfig({ ...production, DATABASE_URL: "" })).toThrow();
    expect(() => readConfig({ ...production, APP_ORIGIN: "http://taskly.example" })).toThrow();
    for (const suffix of ["?sslmode=disable", "?sslmode=no-verify", "?ssl=false", "?sslrootcert=anything"]) expect(() => readConfig({ ...production, DATABASE_URL: production.DATABASE_URL + suffix })).toThrow();
  });
  it("no expone contraseñas ni URLs sensibles en errores de conexión", () => {
    const sensitive = "postgresql://user:do-not-log-this@[invalid";
    let message = "";
    try { readConfig({ ...base, DATABASE_URL: sensitive }); } catch (error) { message = (error as Error).message; }
    expect(message).toBe("DATABASE_URL no válido.");
    expect(() => readConfig({ ...base, DATABASE_URL: "not a URL containing password123" })).toThrow("DATABASE_URL no válido");
    expect(message).not.toContain("do-not-log-this");
    expect(() => readConfig({ ...base, DATABASE_URL: "mysql://localhost/legacy" })).toThrow();
  });
});

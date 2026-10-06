import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { Algorithm, hash, verify } from "@node-rs/argon2";
import type { Database } from "./database";
import type { Config } from "./config";
import * as schema from "./schema";

export function createAuth(db: Database, config: Config) {
  return betterAuth({
    appName: "Taskly 2.0",
    baseURL: config.origin,
    basePath: "/api/auth",
    secret: config.secret,
    database: drizzleAdapter(db, { provider: "pg", schema, transaction: true }),
    trustedOrigins: [config.origin],
    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
      requireEmailVerification: false,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      password: {
        hash: password => hash(password, { algorithm: Algorithm.Argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1, outputLen: 32 }),
        verify: ({ hash, password }) => verify(hash, password)
      }
    },
    session: { expiresIn: 7 * 24 * 60 * 60, disableSessionRefresh: true, cookieCache: { enabled: false } },
    account: { accountLinking: { enabled: false } },
    rateLimit: {
      enabled: true,
      storage: "memory",
      window: 60,
      max: 30,
      customRules: { "/sign-up/email": { window: 60, max: 5 }, "/sign-in/email": { window: 60, max: 10 } }
    },
    advanced: {
      useSecureCookies: config.environment === "production",
      trustedProxyHeaders: false,
      ipAddress: { ipAddressHeaders: ["x-taskly-client-ip"] },
      cookies: { session_token: { name: "taskly2_session", attributes: { httpOnly: true, sameSite: "lax", path: "/" } } }
    },
    logger: { disabled: true },
    onAPIError: { throw: true }
  });
}

export type Auth = ReturnType<typeof createAuth>;

import { it, expect } from "vitest";
import { createServer } from "vite";
import type { AddressInfo } from "node:net";

it("el proxy /api no intercepta el módulo /api.ts del frontend", async () => {
  const vite = await createServer({ configFile: "vite.config.ts", server: { port: 0, strictPort: false, host: "127.0.0.1" } });
  try {
    await vite.listen();
    const port = (vite.httpServer!.address() as AddressInfo).port;
    const response = await fetch(`http://127.0.0.1:${port}/api.ts`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/javascript/);
    expect(await response.text()).toContain("class HttpError");
  } finally { await vite.close(); }
});

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";

const dataDir = await mkdtemp(join(tmpdir(), "taskly-browser-test-"));
const child = spawn(process.execPath, ["--import", "tsx", "--input-type=module", "-e", `
  import { readConfig } from './server/config.ts';
  import { openDatabase, migrate } from './server/database.ts';
  import { createApplication } from './server/app.ts';
  const config = readConfig();
  const database = await openDatabase(config);
  await migrate(database.db);
  const { app } = createApplication(database.db, config, { clientDir: 'dist/client' });
  const server = app.listen(config.port, '127.0.0.1');
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
    server.close(() => void database.close().then(() => process.exit(0)));
  });
`], {
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "test", PORT: "4173", APP_ORIGIN: "http://127.0.0.1:4173", DATA_DIR: dataDir, DATABASE_URL: "", BETTER_AUTH_SECRET: randomBytes(48).toString("base64url") }
});
let stopping = false;
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => { if (!stopping) { stopping = true; child.kill(signal); } });
child.on("exit", async code => { await rm(dataDir, { recursive: true, force: true }); process.exit(code ?? 0); });

import "dotenv/config";
import { openDatabase, migrate } from "./database";
import { readConfig } from "./config";

async function main() {
  const handle = await openDatabase(readConfig());
  try { await migrate(handle.db); console.log("Migración verificada y aplicada."); }
  finally { await handle.close(); }
}
main().catch(() => { console.error("La migración falló. Comprueba la configuración, la conexión y que no se haya editado una migración aplicada."); process.exitCode = 1; });

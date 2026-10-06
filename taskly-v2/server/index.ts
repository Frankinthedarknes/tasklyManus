import "dotenv/config";
import { readConfig } from "./config";
import { migrate, openDatabase } from "./database";
import { createApplication } from "./app";

async function main() {
  const config = readConfig();
  const database = await openDatabase(config);
  try {
    if (config.environment !== "production") await migrate(database.db);
    const { app } = createApplication(database.db, config, config.environment === "production" ? { clientDir: "dist/client" } : {});
    const server = app.listen(config.port, "127.0.0.1", () => console.log(`API lista en el puerto ${config.port}.`));
    let stopping = false;
    const stop = () => {
      if (stopping) return;
      stopping = true;
      server.close(() => void database.close().then(() => process.exit(0), () => process.exit(1)));
      setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.on("SIGTERM", stop);
    process.on("SIGINT", stop);
    server.on("error", () => { console.error("No se pudo iniciar el servidor. Comprueba que el puerto esté libre."); void database.close().finally(() => process.exit(1)); });
  } catch (error) { await database.close(); throw error; }
}

main().catch(() => { console.error("No se pudo iniciar Taskly. Comprueba la configuración y la conexión de la base de datos."); process.exitCode = 1; });

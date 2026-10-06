import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";

const content = `NODE_ENV=development\nPORT=3000\nAPP_ORIGIN=http://localhost:5173\nBETTER_AUTH_SECRET=${randomBytes(48).toString("base64url")}\nDATABASE_URL=\nDATA_DIR=./data/dev\n`;
try {
  await writeFile(new URL("../.env", import.meta.url), content, { flag: "wx", mode: 0o600 });
  console.log("Configuración local creada. Ahora ejecuta: npm run dev");
} catch (error) {
  if (error.code === "EEXIST") console.log("La configuración ya existe. Puedes ejecutar: npm run dev");
  else throw error;
}

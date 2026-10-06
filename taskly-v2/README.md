# Taskly 2.0 · Primer paso

Esta carpeta contiene una aplicación separada para **crear cuenta, iniciar sesión, guardar un perfil y cerrar sesión**. El proyecto anterior permanece completo como referencia. Todavía no hay tareas, chat, pagos ni migración de cuentas antiguas.

## Probarla por primera vez

1. Instala **Node.js 24 LTS**. No necesitas contratar una base de datos para esta prueba local.
2. Descarga la rama **`taskly-2/auth-foundation`**, abre la carpeta del repositorio y luego la carpeta **`taskly-v2`** en una terminal.
3. Ejecuta estas líneas, una por una:

   ```sh
   npm ci
   npm run setup
   npm run dev
   ```

4. Abre **http://localhost:5173**. Usa exactamente esa dirección: no cambies `localhost` por `127.0.0.1`.
5. Pulsa **Crear cuenta**, regístrate con una contraseña de al menos 12 caracteres, inicia sesión, cambia tu ciudad y presentación, guarda y recarga la página. Comprueba que tus datos sigan ahí. Después cierra sesión.

La terminal debe permanecer abierta mientras pruebas. Para detener Taskly, pulsa **Ctrl+C**. La siguiente vez solo necesitas `npm run dev`: la configuración y los datos locales ya están guardados.

Si el puerto está ocupado, cierra la otra instancia de Taskly y vuelve a intentar. Si Node tiene otra versión, instala la 24 antes de continuar. No compartas el archivo `.env` ni la carpeta `data`.

## Lo que funciona

- Registro con validación de correo, nombre y contraseña. Las contraseñas se guardan con Argon2id y una sal aleatoria; la base rechaza contraseñas en texto plano.
- Inicio de sesión con cookie HttpOnly y SameSite=Lax. El token no se entrega a JavaScript ni se guarda en localStorage o sessionStorage.
- Sesión de siete días, almacenada y comprobada en la base de datos. Cerrar sesión revoca esa sesión inmediatamente.
- Perfil de la persona autenticada: nombre, ciudad y presentación. No acepta identificadores de otras cuentas, permisos o cambios de correo.
- Persistencia después de recargar la página y reiniciar el servidor.
- Límites de intentos de registro e inicio de sesión, origen exacto en solicitudes de escritura, cuerpos JSON de hasta 16 KiB y errores sin secretos.

**Es una base para pruebas, todavía no un lanzamiento con usuarios reales.** El correo no se verifica y la recuperación de contraseña no se ha implementado: sus rutas están cerradas. No hay botones ni envíos de correo simulados.

## Estructura

| Carpeta | Responsabilidad |
| --- | --- |
| `client` | Interfaz React en español |
| `server` | API Express, autenticación y acceso a datos |
| `shared` | Validaciones y contratos de la primera entrega |
| `migrations` | Esquema PostgreSQL versionado |
| `tests` | Pruebas HTTP con base real y pruebas de navegador |
| `scripts` | Configuración local y servidor temporal de pruebas |

Versiones exactas en `package.json` y `package-lock.json`: Node 24, React 19, TypeScript 7, Vite 8, Express 5, Better Auth 1.7, Drizzle 0.45 y PostgreSQL. En desarrollo se usa **PGlite**, PostgreSQL embebido en el servidor con archivos en `data/dev`. No es almacenamiento en el navegador. PGlite solo está permitido en desarrollo y tests.

## Comprobaciones

```sh
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit --audit-level=high
```

Las pruebas HTTP usan PGlite con datos temporales y consultas SQL reales. También pueden ejecutarse contra una base PostgreSQL **dedicada a pruebas**, configurando explícitamente `TASKLY_TEST_DATABASE_URL`. Crean y eliminan un esquema temporal propio. Nunca heredan `DATABASE_URL` del proyecto. Las pruebas de navegador arrancan su propio servidor, crean sus propias cuentas y limpian sus archivos temporales.

El workflow `.github/workflows/taskly-v2.yml` comprueba tipos, ambas variantes de base de datos, build, navegador y dependencias. Las pruebas no sustituyen una revisión de seguridad ni validan servicios aún no implementados.

## Preparar un despliegue más adelante

Antes de un piloto se necesitan verificación y recuperación de correo, base PostgreSQL administrada con copias de seguridad, observabilidad, un despliegue HTTPS revisado y pruebas del entorno real.

La configuración de producción rechaza la base embebida, secretos de ejemplo y HTTP. Usa un secreto aleatorio propio, `NODE_ENV=production`, `APP_ORIGIN=https://tu-dominio` y `DATABASE_URL` para una base PostgreSQL separada de la anterior. La conexión exige TLS con verificación del certificado. No desactives la verificación del certificado para resolver errores de conexión.

Las migraciones se aplican explícitamente con `npm run db:migrate` antes de `npm start`; el servidor de producción no modifica el esquema automáticamente. El despliegue debe incluir `migrations/`. El migrador comprueba la suma del archivo aplicado y lo ejecuta en una transacción. Para una segunda migración hay que ampliar el catálogo de migraciones: no editar `0001_auth.sql` si ya se aplicó.

Los límites actuales funcionan por IP del socket y en memoria de un único proceso. Se ignoran los encabezados de IP enviados por clientes. Detrás de un proxy, los clientes compartirían ese límite: antes del piloto hay que configurar la cadena de proxies de confianza y un almacén de límites compartido. El servidor escucha en `127.0.0.1`; su acceso público debe hacerse por el proxy revisado.

No conectar esta base a usuarios o saldos antiguos. La estrategia de migración de cuentas y cualquier lógica financiera necesitan su propia entrega y validación.

## Próximo objetivo

**Publicar una tarea y verla desde otra cuenta.** Primero cerrar la prueba de cuentas y perfiles; después añadir ese recorrido completo con sus permisos y tests.

import { test, expect, type Page } from "@playwright/test";

const PASSWORD = "una frase de navegador larga 2048";
async function signUp(page: Page, email: string, name = "Persona Prueba") {
  await page.goto("/");
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await page.getByLabel("Tu nombre").fill(name);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(page.getByRole("status")).toContainText("registro completada");
}
async function signIn(page: Page, email: string) {
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar a mi cuenta" }).click();
  await expect(page.getByRole("heading", { name: "Tu perfil", exact: true })).toBeVisible();
}

test("registro, login, edición, recarga y logout sin tokens en almacenamiento del navegador", async ({ page, context }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const email = `flow-${Date.now()}@example.test`;
  await signUp(page, email); await signIn(page, email);
  await page.getByLabel("Nombre", { exact: true }).fill("Frank Prueba");
  await page.getByLabel("Ciudad", { exact: false }).fill("Medellín");
  await page.getByLabel("Sobre ti", { exact: false }).fill("Me gusta ayudar con tecnología.");
  await page.getByRole("button", { name: "Guardar perfil" }).click();
  await expect(page.getByRole("status")).toContainText("Perfil guardado");
  await page.reload();
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Frank Prueba");
  await expect(page.getByLabel("Ciudad", { exact: false })).toHaveValue("Medellín");
  await expect(page.getByLabel("Sobre ti", { exact: false })).toHaveValue("Me gusta ayudar con tecnología.");
  const cookies = await context.cookies();
  expect(cookies.find(cookie => cookie.name === "taskly2_session")).toMatchObject({ httpOnly: true, sameSite: "Lax" });
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("heading", { name: "Qué bueno verte por aquí." })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Entrar a mi cuenta" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("dos cuentas separadas y una segunda pestaña revocada tras logout", async ({ browser, baseURL }) => {
  const one = await browser.newContext({ baseURL }), two = await browser.newContext({ baseURL });
  try {
    const a = await one.newPage(), b = await two.newPage();
    const emailA = `account-a-${Date.now()}@example.test`, emailB = `account-b-${Date.now()}@example.test`;
    await signUp(a, emailA, "Primera Persona"); await signIn(a, emailA);
    await a.getByLabel("Ciudad", { exact: false }).fill("Bogotá");
    await a.getByRole("button", { name: "Guardar perfil" }).click();
    await expect(a.getByRole("status")).toContainText("Perfil guardado");
    await signUp(b, emailB, "Segunda Persona"); await signIn(b, emailB);
    await expect(b.getByLabel("Ciudad", { exact: false })).toHaveValue("");
    const tab = await one.newPage(); await tab.goto("/");
    await expect(tab.getByLabel("Ciudad", { exact: false })).toHaveValue("Bogotá");
    await a.getByRole("button", { name: "Cerrar sesión" }).click();
    await tab.reload();
    await expect(tab.getByRole("button", { name: "Entrar a mi cuenta" })).toBeVisible();
    await b.reload();
    await expect(b.getByRole("heading", { name: "Tu perfil", exact: true })).toBeVisible();
  } finally { await one.close(); await two.close(); }
});

test("flujo móvil sin desbordamiento y con error útil ante contraseña incorrecta", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const email = `mobile-${Date.now()}@example.test`;
  await signUp(page, email);
  await page.getByLabel("Contraseña", { exact: true }).fill("contraseña incorrecta");
  await page.getByRole("button", { name: "Entrar a mi cuenta" }).click();
  await expect(page.getByRole("alert")).toContainText("no son correctos");
  await signIn(page, email);
  await expect(page.getByRole("heading", { name: "Ya tienes un comienzo." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel("Ciudad", { exact: false }).fill("Cali");
  await page.getByRole("button", { name: "Guardar perfil" }).click();
  await expect(page.getByRole("status")).toContainText("Perfil guardado");
  await page.reload();
  await expect(page.getByLabel("Ciudad", { exact: false })).toHaveValue("Cali");
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("button", { name: "Entrar a mi cuenta" })).toBeVisible();
});

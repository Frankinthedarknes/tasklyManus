import type { Profile } from "../shared/contracts";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method, credentials: "same-origin", cache: "no-store",
      ...(body === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
    });
  } catch { throw new HttpError(0, "No pudimos conectar. Comprueba que Taskly siga abierto y vuelve a probar."); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new HttpError(response.status, data.error ?? "No se pudo completar la solicitud.");
  return data as T;
}

export const getProfile = () => request<{ profile: Profile }>("/api/profile");

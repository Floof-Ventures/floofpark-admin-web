export class AuthRequiredError extends Error {
  constructor() {
    super("auth required");
    this.name = "AuthRequiredError";
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: { Accept: "application/json", ...(init.headers ?? {}) },
    ...init,
  });
  if (response.status === 401) throw new AuthRequiredError();
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

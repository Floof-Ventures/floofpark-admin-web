import { clearToken, getToken } from "@/auth/tokenStorage";

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
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.headers as Record<string, string> | undefined ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { ...init, headers });
  if (response.status === 401) {
    clearToken();
    throw new AuthRequiredError();
  }
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const KEY = "floofpark_admin_access_token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  localStorage.setItem(KEY, token);
}

export function clearToken(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

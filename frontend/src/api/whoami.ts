import { apiFetch } from "./client";

export interface CurrentUser { id: string; email: string; }

export async function whoami(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("https://auth.floofpark.app/api/v1/auth/me");
}

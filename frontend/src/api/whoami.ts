import { apiFetch } from "./client";

export interface CurrentUser {
  email: string;
  user_id: string | null;
}

export function whoami(): Promise<CurrentUser> {
  return apiFetch<CurrentUser>("https://auth.floofpark.com/api/v1/auth/me");
}

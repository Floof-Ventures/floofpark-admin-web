import { apiFetch } from "./client";

export interface AuthzCheckTuple {
  user: string;
  relation: string;
  object_type: string;
  object_id: string;
}

export async function checkAuthz(tuple: AuthzCheckTuple): Promise<boolean> {
  const result = await apiFetch<{ allowed: boolean }>(
    "https://auth.floofpark.app/api/v1/authz/check",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tuple),
    },
  );
  return result.allowed;
}

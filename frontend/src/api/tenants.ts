import { apiFetch } from "./client";

export type TenantType = "business" | "household" | "platform";
export type TenantState = "active" | "suspended" | "archived" | "purged";

export interface Tenant {
  id: string;
  display_name: string;
  type: TenantType;
  slug: string;
  legal_name: string | null;
  state: TenantState;
  suspension_causes: string[];
  suspended_until: string | null;
  suspension_reason: string | null;
  created_at: string;
}

// Real API shape: { tenants: Tenant[], next_cursor: string | null }
export interface TenantsPage {
  tenants: Tenant[];
  next_cursor: string | null;
}

const BASE = "https://tenant-identity.floofpark.app/api/v1/tenants";

export async function listTenants(
  params: { limit?: number; cursor?: string; type?: TenantType; state?: TenantState } = {},
): Promise<TenantsPage> {
  const u = new URL(BASE);
  if (params.limit != null) u.searchParams.set("limit", String(params.limit));
  if (params.cursor) u.searchParams.set("cursor", params.cursor);
  if (params.type) u.searchParams.set("type", params.type);
  if (params.state) u.searchParams.set("state", params.state);
  return apiFetch<TenantsPage>(u.toString());
}

export async function getTenant(id: string): Promise<Tenant> {
  return apiFetch<Tenant>(`${BASE}/${id}`);
}

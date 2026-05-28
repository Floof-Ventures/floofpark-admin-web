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
  metadata: { business_categories?: BusinessCategory[] } | null;
}

// Real API shape: { tenants: Tenant[], next_cursor: string | null }
export interface TenantsPage {
  tenants: Tenant[];
  next_cursor: string | null;
}

const BASE = "https://tenants.floofpark.com/api/v1/tenants";

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

// Mirrors floofpark-offerings spec §6.2 type registry; superadmin picks
// the types the new business plans to offer at onboarding. The list isn't
// load-bearing — the owner adds/removes offerings later via business-web.
export const BUSINESS_CATEGORIES = [
  "daycare",
  "boarding",
  "grooming",
  "training",
  "space_booking",
  "retail",
  "rental",
  "custom",
] as const;
export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

export interface CreateBusinessTenantInput {
  legal_name: string;
  display_name: string;
  slug: string;
  business_categories: BusinessCategory[];
  invite_owner_email: string;
}

// Slice A — superadmin onboards a business tenant; tenant-identity
// auto-provisions a default "Main" location and invites the owner by email.
// The server auto-disables add_creator_as_admin when invite_owner_email is
// set, so we omit it from the request body.
export async function createBusinessTenant(
  input: CreateBusinessTenantInput,
): Promise<Tenant> {
  return apiFetch<Tenant>(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "business",
      legal_name: input.legal_name,
      display_name: input.display_name,
      slug: input.slug,
      invite_owner_email: input.invite_owner_email,
      metadata: { business_categories: input.business_categories },
    }),
  });
}

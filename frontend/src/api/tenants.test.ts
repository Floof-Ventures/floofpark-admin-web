import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { listTenants, getTenant } from "./tenants";

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Real API shape: GET /api/v1/tenants returns { tenants: [...], next_cursor }
// Filter params: type, state, cursor, limit — NO text/q search
test("listTenants returns the tenants array from /api/v1/tenants", async () => {
  server.use(
    http.get("https://tenant-identity.floofpark.app/api/v1/tenants", ({ request }) => {
      const u = new URL(request.url);
      expect(u.searchParams.get("limit")).toBe("50");
      return HttpResponse.json({
        tenants: [
          {
            id: "t1",
            display_name: "Acme Vet",
            type: "business",
            slug: "acme-vet",
            legal_name: "Acme Veterinary LLC",
            state: "active",
            suspension_causes: [],
            suspended_until: null,
            suspension_reason: null,
            created_at: "2026-01-01T00:00:00",
          },
        ],
        next_cursor: null,
      });
    }),
  );
  const result = await listTenants({ limit: 50 });
  expect(result.tenants[0].display_name).toBe("Acme Vet");
  expect(result.next_cursor).toBeNull();
});

test("listTenants passes type filter", async () => {
  let capturedType: string | null = null;
  server.use(
    http.get("https://tenant-identity.floofpark.app/api/v1/tenants", ({ request }) => {
      capturedType = new URL(request.url).searchParams.get("type");
      return HttpResponse.json({ tenants: [], next_cursor: null });
    }),
  );
  await listTenants({ type: "household" });
  expect(capturedType).toBe("household");
});

test("getTenant returns the tenant by id", async () => {
  server.use(
    http.get("https://tenant-identity.floofpark.app/api/v1/tenants/t1", () =>
      HttpResponse.json({
        id: "t1",
        display_name: "Acme Vet",
        type: "business",
        slug: "acme-vet",
        legal_name: "Acme Veterinary LLC",
        state: "active",
        suspension_causes: [],
        suspended_until: null,
        suspension_reason: null,
        created_at: "2026-01-01T00:00:00",
      }),
    ),
  );
  await expect(getTenant("t1")).resolves.toMatchObject({ id: "t1", display_name: "Acme Vet" });
});

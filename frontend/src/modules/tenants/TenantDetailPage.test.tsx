import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { TenantDetailPage } from "./TenantDetailPage";

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrap(initialPath: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={qc}>
        <Routes>
          <Route path="/tenants/:id" element={<TenantDetailPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

const TENANT = {
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
  metadata: { business_categories: ["daycare", "boarding"] },
};

const emptyMembers = () => HttpResponse.json({ memberships: [] });

function useTenant(handlers: ReturnType<typeof http.get>[] = []) {
  server.use(
    http.get("https://tenants.floofpark.com/api/v1/tenants/t1", () =>
      HttpResponse.json(TENANT),
    ),
    http.get(
      "https://tenants.floofpark.com/api/v1/tenants/t1/memberships",
      emptyMembers,
    ),
    ...handlers,
  );
}

test("shows tenant header with id, name, and type", async () => {
  useTenant();
  wrap("/tenants/t1");
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: "Acme Vet" })).toBeInTheDocument(),
  );
  expect(screen.getByText(/t1/)).toBeInTheDocument();
  expect(screen.getByText(/business/i)).toBeInTheDocument();
});

test("renders slug, created_at, and business_categories chips", async () => {
  useTenant();
  wrap("/tenants/t1");
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: "Acme Vet" })).toBeInTheDocument(),
  );
  expect(screen.getByText("acme-vet")).toBeInTheDocument();
  expect(screen.getByText(/2026-01-01/)).toBeInTheDocument();
  expect(screen.getByText(/Daycare/i)).toBeInTheDocument();
  expect(screen.getByText(/Boarding/i)).toBeInTheDocument();
});

test("hides categories section when metadata is null", async () => {
  server.use(
    http.get("https://tenants.floofpark.com/api/v1/tenants/t1", () =>
      HttpResponse.json({ ...TENANT, metadata: null }),
    ),
    http.get(
      "https://tenants.floofpark.com/api/v1/tenants/t1/memberships",
      emptyMembers,
    ),
  );
  wrap("/tenants/t1");
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: "Acme Vet" })).toBeInTheDocument(),
  );
  expect(screen.queryByText(/Daycare/i)).not.toBeInTheDocument();
});

test("renders Members section with member rows", async () => {
  server.use(
    http.get("https://tenants.floofpark.com/api/v1/tenants/t1", () =>
      HttpResponse.json(TENANT),
    ),
    http.get(
      "https://tenants.floofpark.com/api/v1/tenants/t1/memberships",
      () =>
        HttpResponse.json({
          memberships: [
            {
              id: "m1",
              user_id: "u1@x.com",
              tenant_id: "t1",
              role: "owner",
              state: "active",
              joined_at: "2026-01-02T00:00:00",
              invited_at: null,
              removed_at: null,
              user: {
                id: "u1@x.com",
                email: "alice@example.com",
                display_name: "Alice Adams",
              },
            },
            {
              id: "m2",
              user_id: "u2@x.com",
              tenant_id: "t1",
              role: "member",
              state: "invited",
              joined_at: null,
              invited_at: "2026-02-01T00:00:00",
              removed_at: null,
              user: {
                id: "u2@x.com",
                email: "bob@example.com",
                display_name: null,
              },
            },
          ],
        }),
    ),
  );
  wrap("/tenants/t1");
  await waitFor(() => screen.getByText("Alice Adams"));
  expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  // Bob has no display_name → email becomes the primary line.
  expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  // Roles rendered.
  expect(screen.getByText("owner")).toBeInTheDocument();
  expect(screen.getByText("member")).toBeInTheDocument();
  // Member-level states rendered as pills.
  expect(screen.getByText("invited")).toBeInTheDocument();
});

test("shows 'No members yet.' empty state", async () => {
  useTenant();
  wrap("/tenants/t1");
  await waitFor(() =>
    expect(screen.getByText(/no members yet/i)).toBeInTheDocument(),
  );
});

test("activity placeholder remains", async () => {
  useTenant();
  wrap("/tenants/t1");
  await waitFor(() =>
    expect(screen.getByText(/audit timeline coming in wave 0\.5/i)).toBeInTheDocument(),
  );
});

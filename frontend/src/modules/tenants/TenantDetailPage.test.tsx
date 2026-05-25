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
};

test("shows tenant header with id, name, and type", async () => {
  server.use(
    http.get("https://tenants.floofpark.com/api/v1/tenants/t1", () =>
      HttpResponse.json(TENANT),
    ),
  );
  wrap("/tenants/t1");
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: "Acme Vet" })).toBeInTheDocument(),
  );
  expect(screen.getByText(/t1/)).toBeInTheDocument();
  expect(screen.getByText(/business/i)).toBeInTheDocument();
});

test("shows a 'members coming in Wave 0.5' placeholder", async () => {
  server.use(
    http.get("https://tenants.floofpark.com/api/v1/tenants/t1", () =>
      HttpResponse.json(TENANT),
    ),
  );
  wrap("/tenants/t1");
  expect(await screen.findByText(/members coming in wave 0\.5/i)).toBeInTheDocument();
});

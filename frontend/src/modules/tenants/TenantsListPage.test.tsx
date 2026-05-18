import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { TenantsListPage } from "./TenantsListPage";

// Real API: GET /api/v1/tenants returns { tenants: [...], next_cursor }
// No server-side text search; type/state are server-side filters.
// Search input filters client-side by display_name.

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
    </MemoryRouter>,
  );
}

const TENANTS_RESPONSE = {
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
    {
      id: "t2",
      display_name: "Smith Household",
      type: "household",
      slug: "smith-household",
      legal_name: null,
      state: "active",
      suspension_causes: [],
      suspended_until: null,
      suspension_reason: null,
      created_at: "2026-01-02T00:00:00",
    },
  ],
  next_cursor: null,
};

test("renders tenants with type badges and a search field", async () => {
  server.use(
    http.get("https://tenants.floofpark.app/api/v1/tenants", () =>
      HttpResponse.json(TENANTS_RESPONSE),
    ),
  );
  wrap(<TenantsListPage />);
  await waitFor(() => expect(screen.getByText("Acme Vet")).toBeInTheDocument());
  expect(screen.getByText("Smith Household")).toBeInTheDocument();
  expect(screen.getAllByText(/business|household/i).length).toBeGreaterThanOrEqual(2);
  expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
});

test("search input filters displayed rows client-side", async () => {
  server.use(
    http.get("https://tenants.floofpark.app/api/v1/tenants", () =>
      HttpResponse.json(TENANTS_RESPONSE),
    ),
  );
  wrap(<TenantsListPage />);
  await waitFor(() => expect(screen.getByText("Acme Vet")).toBeInTheDocument());
  await userEvent.type(screen.getByPlaceholderText(/search/i), "acme");
  await waitFor(() => expect(screen.queryByText("Smith Household")).not.toBeInTheDocument());
  expect(screen.getByText("Acme Vet")).toBeInTheDocument();
});

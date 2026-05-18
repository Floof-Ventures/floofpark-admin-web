import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { SuperadminGate } from "./SuperadminGate";

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

test("renders children when allowed=true", async () => {
  server.use(
    http.get("https://auth.floofpark.app/api/v1/auth/me", () => HttpResponse.json({ id: "u1", email: "z@floof.ventures" })),
    http.post("https://auth.floofpark.app/api/v1/authz/check", () => HttpResponse.json({ allowed: true })),
  );
  wrap(<SuperadminGate><div data-testid="inner">ok</div></SuperadminGate>);
  await waitFor(() => expect(screen.getByTestId("inner")).toBeInTheDocument());
});

test("renders NoAccessPage when allowed=false", async () => {
  server.use(
    http.get("https://auth.floofpark.app/api/v1/auth/me", () => HttpResponse.json({ id: "u1", email: "z@floof.ventures" })),
    http.post("https://auth.floofpark.app/api/v1/authz/check", () => HttpResponse.json({ allowed: false })),
  );
  wrap(<SuperadminGate><div data-testid="inner">ok</div></SuperadminGate>);
  await waitFor(() => expect(screen.getByText(/no access/i)).toBeInTheDocument());
});

test("redirects to login on 401 from whoami", async () => {
  const original = window.location;
  const assignMock = vi.fn();
  // @ts-expect-error
  delete window.location;
  // @ts-expect-error
  window.location = { ...original, assign: assignMock, href: "https://admin.floofpark.com/tenants" };

  server.use(
    http.get("https://auth.floofpark.app/api/v1/auth/me", () => new HttpResponse(null, { status: 401 })),
  );
  wrap(<SuperadminGate><div>inner</div></SuperadminGate>);
  await waitFor(() => expect(assignMock).toHaveBeenCalled());

  // @ts-expect-error restore
  window.location = original;
});

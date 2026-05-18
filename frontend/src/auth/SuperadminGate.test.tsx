import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { SuperadminGate } from "./SuperadminGate";
import { setToken } from "./tokenStorage";

const server = setupServer();
beforeAll(() => server.listen());
beforeEach(() => localStorage.clear());
afterEach(() => { server.resetHandlers(); localStorage.clear(); });
afterAll(() => server.close());

function makeToken(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" })).replace(/=/g, "");
  const body = btoa(JSON.stringify(payload)).replace(/=/g, "");
  return `${header}.${body}.signature`;
}

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

test("renders children when authz allowed=true and token is valid", async () => {
  setToken(makeToken({ sub: "z@floof.ventures", user_id: "u1", aud: "floofpark", exp: 9999999999 }));
  server.use(
    http.post("https://auth.floofpark.app/api/v1/authz/check", () => HttpResponse.json({ allowed: true })),
  );
  wrap(<SuperadminGate><div data-testid="inner">ok</div></SuperadminGate>);
  await waitFor(() => expect(screen.getByTestId("inner")).toBeInTheDocument());
});

test("renders NoAccessPage when authz denies", async () => {
  setToken(makeToken({ sub: "z@floof.ventures", user_id: "u1", aud: "floofpark", exp: 9999999999 }));
  server.use(
    http.post("https://auth.floofpark.app/api/v1/authz/check", () => HttpResponse.json({ allowed: false })),
  );
  wrap(<SuperadminGate><div>inner</div></SuperadminGate>);
  await waitFor(() => expect(screen.getByText(/no access/i)).toBeInTheDocument());
});

test("redirects to login when no token is present", async () => {
  const original = window.location;
  const assignMock = vi.fn();
  // @ts-expect-error
  delete window.location;
  // @ts-expect-error
  window.location = { ...original, assign: assignMock, href: "https://admin.floofpark.com/tenants" };

  wrap(<SuperadminGate><div>inner</div></SuperadminGate>);
  await waitFor(() => expect(assignMock).toHaveBeenCalled());

  // @ts-expect-error restore
  window.location = original;
});

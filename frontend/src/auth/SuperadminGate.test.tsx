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

test("renders children when /me + /authz both succeed", async () => {
  server.use(
    http.get("https://auth.floofpark.com/api/v1/auth/me", () =>
      HttpResponse.json({ email: "z@floof.ventures", user_id: null }),
    ),
    http.post("https://auth.floofpark.com/api/v1/authz/check", () =>
      HttpResponse.json({ allowed: true }),
    ),
  );
  wrap(<SuperadminGate><div data-testid="inner">ok</div></SuperadminGate>);
  await waitFor(() => expect(screen.getByTestId("inner")).toBeInTheDocument());
});

test("renders NoAccessPage when /authz denies", async () => {
  server.use(
    http.get("https://auth.floofpark.com/api/v1/auth/me", () =>
      HttpResponse.json({ email: "z@floof.ventures", user_id: null }),
    ),
    http.post("https://auth.floofpark.com/api/v1/authz/check", () =>
      HttpResponse.json({ allowed: false }),
    ),
  );
  wrap(<SuperadminGate><div>inner</div></SuperadminGate>);
  await waitFor(() => expect(screen.getByText(/no access/i)).toBeInTheDocument());
});

test("redirects to login when /me 401s and refresh also fails", async () => {
  const original = window.location;
  const assignMock = vi.fn();
  // @ts-expect-error
  delete window.location;
  // @ts-expect-error
  window.location = { ...original, assign: assignMock, href: "https://admin.floofpark.com/tenants" };

  server.use(
    http.get("https://auth.floofpark.com/api/v1/auth/me", () => new HttpResponse(null, { status: 401 })),
    http.post("https://auth.floofpark.com/api/v1/auth/refresh", () => new HttpResponse(null, { status: 401 })),
  );
  wrap(<SuperadminGate><div>inner</div></SuperadminGate>);
  await waitFor(() => expect(assignMock).toHaveBeenCalled());

  // @ts-expect-error restore
  window.location = original;
});

test("uses email as authz subject", async () => {
  let observed: string | undefined;
  let observedObjectType: string | undefined;
  let observedObjectId: string | undefined;
  server.use(
    http.get("https://auth.floofpark.com/api/v1/auth/me", () =>
      HttpResponse.json({ email: "z@floof.ventures", user_id: null }),
    ),
    http.post("https://auth.floofpark.com/api/v1/authz/check", async ({ request }) => {
      const body = (await request.json()) as {
        user: string;
        relation: string;
        object_type: string;
        object_id: string;
      };
      observed = `${body.user}#${body.relation}`;
      observedObjectType = body.object_type;
      observedObjectId = body.object_id;
      return HttpResponse.json({ allowed: true });
    }),
  );
  wrap(<SuperadminGate><div data-testid="inner">ok</div></SuperadminGate>);
  await waitFor(() => expect(screen.getByTestId("inner")).toBeInTheDocument());
  expect(observed).toBe("user:z@floof.ventures#superadmin");
  expect(observedObjectType).toBe("tenant");
  expect(observedObjectId).toBe("00000000-0000-0000-0000-000000000001");
});

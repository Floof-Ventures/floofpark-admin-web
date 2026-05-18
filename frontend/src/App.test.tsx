import { render, screen } from "@testing-library/react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from "vitest";
import { App } from "./App";
import { setToken } from "./auth/tokenStorage";

const server = setupServer();
beforeAll(() => server.listen());
beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/login");
});
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

function makeToken(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" })).replace(/=/g, "");
  const body = btoa(JSON.stringify(payload)).replace(/=/g, "");
  return `${header}.${body}.signature`;
}

test("ungated /login route renders the email form inside AppShell", () => {
  render(<App />);
  expect(screen.getByText("FloofPark")).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
});

test("gated /tenants route renders list when superadmin is allowed", async () => {
  setToken(makeToken({ sub: "z@floof.ventures", user_id: "u1", aud: "floofpark", exp: 9999999999 }));
  window.history.pushState({}, "", "/tenants");
  server.use(
    http.post("https://auth.floofpark.app/api/v1/authz/check", () => HttpResponse.json({ allowed: true })),
    http.get("https://tenants.floofpark.app/api/v1/tenants", () =>
      HttpResponse.json({ tenants: [], next_cursor: null }),
    ),
  );
  render(<App />);
  expect(await screen.findByRole("heading", { name: /tenants/i })).toBeInTheDocument();
});

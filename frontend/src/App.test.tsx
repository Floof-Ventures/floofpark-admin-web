import { render, screen } from "@testing-library/react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from "vitest";
import { App } from "./App";

const server = setupServer();
beforeAll(() => server.listen());
beforeEach(() => {
  window.history.pushState({}, "", "/login");
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("ungated /login route renders the email form inside AppShell", () => {
  render(<App />);
  expect(screen.getByText("FloofPark")).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
});

test("gated /tenants route renders list when superadmin is allowed", async () => {
  window.history.pushState({}, "", "/tenants");
  server.use(
    http.get("https://auth.floofpark.com/api/v1/auth/me", () =>
      HttpResponse.json({ email: "z@floof.ventures", user_id: null }),
    ),
    http.post("https://auth.floofpark.com/api/v1/authz/check", () =>
      HttpResponse.json({ allowed: true }),
    ),
    http.get("https://tenants.floofpark.com/api/v1/tenants", () =>
      HttpResponse.json({ tenants: [], next_cursor: null }),
    ),
  );
  render(<App />);
  expect(await screen.findByRole("heading", { name: /tenants/i })).toBeInTheDocument();
});

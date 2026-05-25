import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from "vitest";
import { checkAuthz } from "./authz";

const server = setupServer();
beforeAll(() => server.listen());
beforeEach(() => localStorage.clear());
afterEach(() => { server.resetHandlers(); localStorage.clear(); });
afterAll(() => server.close());

test("checkAuthz posts the tuple to /api/v1/authz/check and returns allowed flag", async () => {
  let body: Record<string, unknown> | null = null;
  server.use(
    http.post("https://auth.floofpark.com/api/v1/authz/check", async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({ allowed: true });
    }),
  );
  const allowed = await checkAuthz({ user: "user:abc", relation: "superadmin", object_type: "tenant", object_id: "platform" });
  expect(allowed).toBe(true);
  expect(body).toEqual({ user: "user:abc", relation: "superadmin", object_type: "tenant", object_id: "platform" });
});

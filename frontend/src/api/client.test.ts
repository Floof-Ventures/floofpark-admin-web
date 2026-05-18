import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { apiFetch, AuthRequiredError } from "./client";

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("apiFetch sends credentials and returns parsed JSON on 200", async () => {
  server.use(
    http.get("https://auth.floofpark.app/ping", ({ request }) => {
      expect(request.credentials).toBe("include");
      return HttpResponse.json({ ok: true });
    }),
  );
  const result = await apiFetch("https://auth.floofpark.app/ping");
  expect(result).toEqual({ ok: true });
});

test("apiFetch throws AuthRequiredError on 401", async () => {
  server.use(http.get("https://auth.floofpark.app/me", () => new HttpResponse(null, { status: 401 })));
  await expect(apiFetch("https://auth.floofpark.app/me")).rejects.toBeInstanceOf(AuthRequiredError);
});

test("apiFetch throws Error on 5xx", async () => {
  server.use(http.get("https://auth.floofpark.app/x", () => new HttpResponse("boom", { status: 500 })));
  await expect(apiFetch("https://auth.floofpark.app/x")).rejects.toThrow(/500/);
});

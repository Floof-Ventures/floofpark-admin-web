import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from "vitest";
import { apiFetch, AuthRequiredError } from "./client";
import { setToken, getToken } from "@/auth/tokenStorage";

const server = setupServer();
beforeAll(() => server.listen());
beforeEach(() => localStorage.clear());
afterEach(() => { server.resetHandlers(); localStorage.clear(); });
afterAll(() => server.close());

test("apiFetch sends Authorization header when token is present and returns parsed JSON on 200", async () => {
  setToken("abc.def.ghi");
  server.use(
    http.get("https://auth.floofpark.app/ping", ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer abc.def.ghi");
      return HttpResponse.json({ ok: true });
    }),
  );
  await expect(apiFetch("https://auth.floofpark.app/ping")).resolves.toEqual({ ok: true });
});

test("apiFetch omits Authorization when no token is stored", async () => {
  server.use(
    http.get("https://auth.floofpark.app/ping", ({ request }) => {
      expect(request.headers.get("Authorization")).toBeNull();
      return HttpResponse.json({ ok: true });
    }),
  );
  await apiFetch("https://auth.floofpark.app/ping");
});

test("apiFetch throws AuthRequiredError and clears token on 401", async () => {
  setToken("abc.def.ghi");
  server.use(http.get("https://auth.floofpark.app/me", () => new HttpResponse(null, { status: 401 })));
  await expect(apiFetch("https://auth.floofpark.app/me")).rejects.toBeInstanceOf(AuthRequiredError);
  expect(getToken()).toBeNull();
});

test("apiFetch throws Error on 5xx", async () => {
  server.use(http.get("https://auth.floofpark.app/x", () => new HttpResponse("boom", { status: 500 })));
  await expect(apiFetch("https://auth.floofpark.app/x")).rejects.toThrow(/500/);
});

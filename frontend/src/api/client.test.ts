import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { apiFetch, AuthRequiredError } from "./client";

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("apiFetch sends credentials:include and returns parsed JSON on 200", async () => {
  let capturedCredentials: string | undefined;
  server.use(
    http.get("https://auth.floofpark.com/ping", ({ request }) => {
      capturedCredentials = request.credentials;
      return HttpResponse.json({ ok: true });
    }),
  );
  await expect(apiFetch("https://auth.floofpark.com/ping")).resolves.toEqual({ ok: true });
  expect(capturedCredentials).toBe("include");
});

test("apiFetch does NOT send an Authorization header", async () => {
  server.use(
    http.get("https://auth.floofpark.com/ping", ({ request }) => {
      expect(request.headers.get("Authorization")).toBeNull();
      return HttpResponse.json({ ok: true });
    }),
  );
  await apiFetch("https://auth.floofpark.com/ping");
});

test("apiFetch retries once on 401 after successful refresh and returns the retried response", async () => {
  let callCount = 0;
  server.use(
    http.get("https://auth.floofpark.com/me", () => {
      callCount++;
      if (callCount === 1) return new HttpResponse(null, { status: 401 });
      return HttpResponse.json({ ok: true });
    }),
    http.post("https://auth.floofpark.com/api/v1/auth/refresh", () =>
      new HttpResponse(null, { status: 204 }),
    ),
  );
  await expect(apiFetch("https://auth.floofpark.com/me")).resolves.toEqual({ ok: true });
  expect(callCount).toBe(2);
});

test("apiFetch throws AuthRequiredError when refresh fails and second 401 occurs", async () => {
  server.use(
    http.get("https://auth.floofpark.com/me", () => new HttpResponse(null, { status: 401 })),
    http.post("https://auth.floofpark.com/api/v1/auth/refresh", () =>
      new HttpResponse(null, { status: 401 }),
    ),
  );
  await expect(apiFetch("https://auth.floofpark.com/me")).rejects.toBeInstanceOf(AuthRequiredError);
});

test("apiFetch throws Error on 5xx", async () => {
  server.use(http.get("https://auth.floofpark.com/x", () => new HttpResponse("boom", { status: 500 })));
  await expect(apiFetch("https://auth.floofpark.com/x")).rejects.toThrow(/500/);
});

test("apiFetch returns undefined on 204", async () => {
  server.use(
    http.delete("https://auth.floofpark.com/x", () => new HttpResponse(null, { status: 204 })),
  );
  await expect(apiFetch("https://auth.floofpark.com/x", { method: "DELETE" })).resolves.toBeUndefined();
});

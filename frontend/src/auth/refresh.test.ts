import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from "vitest";
import { tryRefresh } from "./refresh";

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Reset inflight state between tests by waiting a tick after each
beforeEach(async () => {
  await new Promise((r) => setTimeout(r, 0));
});

test("POSTs to /refresh with credentials:include and returns true on 204", async () => {
  let capturedCredentials: string | undefined;
  server.use(
    http.post("https://auth.floofpark.com/api/v1/auth/refresh", ({ request }) => {
      capturedCredentials = request.credentials;
      return new HttpResponse(null, { status: 204 });
    }),
  );
  const result = await tryRefresh();
  expect(result).toBe(true);
  expect(capturedCredentials).toBe("include");
});

test("returns false on 401", async () => {
  server.use(
    http.post("https://auth.floofpark.com/api/v1/auth/refresh", () =>
      new HttpResponse(null, { status: 401 }),
    ),
  );
  const result = await tryRefresh();
  expect(result).toBe(false);
});

test("concurrent calls share the same in-flight promise", async () => {
  let callCount = 0;
  server.use(
    http.post("https://auth.floofpark.com/api/v1/auth/refresh", async () => {
      callCount++;
      // small delay to keep inflight window open
      await new Promise((r) => setTimeout(r, 10));
      return new HttpResponse(null, { status: 204 });
    }),
  );
  const [r1, r2, r3] = await Promise.all([tryRefresh(), tryRefresh(), tryRefresh()]);
  expect(r1).toBe(true);
  expect(r2).toBe(true);
  expect(r3).toBe(true);
  expect(callCount).toBe(1);
});

test("returns false when fetch throws (network error)", async () => {
  server.use(
    http.post("https://auth.floofpark.com/api/v1/auth/refresh", () => {
      throw new Error("network down");
    }),
  );
  const result = await tryRefresh();
  expect(result).toBe(false);
});

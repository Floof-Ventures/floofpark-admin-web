import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { whoami } from "./whoami";
import { AuthRequiredError } from "./client";

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("calls GET /api/v1/auth/me with credentials:include and returns the parsed body on 200", async () => {
  let capturedCredentials: string | undefined;
  server.use(
    http.get("https://auth.floofpark.com/api/v1/auth/me", ({ request }) => {
      capturedCredentials = request.credentials;
      return HttpResponse.json({ email: "z@floof.ventures", user_id: null });
    }),
  );
  const result = await whoami();
  expect(result).toEqual({ email: "z@floof.ventures", user_id: null });
  expect(capturedCredentials).toBe("include");
});

test("throws AuthRequiredError on 401 after refresh also fails", async () => {
  server.use(
    http.get("https://auth.floofpark.com/api/v1/auth/me", () =>
      new HttpResponse(null, { status: 401 }),
    ),
    http.post("https://auth.floofpark.com/api/v1/auth/refresh", () =>
      new HttpResponse(null, { status: 401 }),
    ),
  );
  await expect(whoami()).rejects.toBeInstanceOf(AuthRequiredError);
});

import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { whoami } from "./whoami";

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("whoami returns the current user", async () => {
  server.use(
    http.get("https://auth.floofpark.app/api/v1/auth/me", () =>
      HttpResponse.json({ id: "u1", email: "z@floof.ventures" }),
    ),
  );
  await expect(whoami()).resolves.toEqual({ id: "u1", email: "z@floof.ventures" });
});

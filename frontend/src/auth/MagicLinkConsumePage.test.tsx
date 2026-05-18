import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from "vitest";
import { MagicLinkConsumePage } from "./MagicLinkConsumePage";
import { getToken } from "./tokenStorage";

const server = setupServer();
beforeAll(() => server.listen());
beforeEach(() => localStorage.clear());
afterEach(() => { server.resetHandlers(); localStorage.clear(); });
afterAll(() => server.close());

function wrap(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/auth/consume" element={<MagicLinkConsumePage />} />
        <Route path="/tenants" element={<div data-testid="tenants">tenants page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

test("clicking sign-in posts the token, stores access_token, and navigates", async () => {
  server.use(
    http.post("https://auth.floofpark.app/api/v1/auth/magic-link/consume", async ({ request }) => {
      const body = await request.text();
      expect(body).toBe("token=magic123");
      return HttpResponse.json({ access_token: "JWT_TOKEN", token_type: "Bearer", expires_in: 300 });
    }),
  );
  wrap("/auth/consume?token=magic123");
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
  await waitFor(() => expect(getToken()).toBe("JWT_TOKEN"));
  await waitFor(() => expect(screen.getByTestId("tenants")).toBeInTheDocument());
});

test("shows error when token is missing", () => {
  wrap("/auth/consume");
  expect(screen.getByRole("alert")).toHaveTextContent(/missing/i);
});

test("shows error when consume fails", async () => {
  server.use(
    http.post("https://auth.floofpark.app/api/v1/auth/magic-link/consume", () => new HttpResponse(null, { status: 400 })),
  );
  wrap("/auth/consume?token=bad");
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/400/));
});

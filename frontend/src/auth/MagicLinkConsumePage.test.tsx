import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { MagicLinkConsumePage } from "./MagicLinkConsumePage";

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrap(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/auth/consume" element={<MagicLinkConsumePage />} />
        <Route path="/tenants" element={<div data-testid="tenants">tenants page</div>} />
        <Route path="/other" element={<div data-testid="other">other page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

test("clicking sign-in POSTs with credentials:include and navigates on 200 even with empty body", async () => {
  let capturedCredentials: string | undefined;
  server.use(
    http.post("https://auth.floofpark.app/api/v1/auth/magic-link/consume", ({ request }) => {
      capturedCredentials = request.credentials;
      // Return 200 with empty body (cookies are set by browser from Set-Cookie header)
      return new HttpResponse(null, { status: 200 });
    }),
  );
  wrap("/auth/consume?token=magic123");
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
  await waitFor(() => expect(screen.getByTestId("tenants")).toBeInTheDocument());
  expect(capturedCredentials).toBe("include");
});

test("navigates to return_to path on success", async () => {
  server.use(
    http.post("https://auth.floofpark.app/api/v1/auth/magic-link/consume", () =>
      new HttpResponse(null, { status: 200 }),
    ),
  );
  wrap("/auth/consume?token=magic123&return_to=/other");
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
  await waitFor(() => expect(screen.getByTestId("other")).toBeInTheDocument());
});

test("protocol-relative open-redirect is rejected and falls back to /tenants", async () => {
  server.use(
    http.post("https://auth.floofpark.app/api/v1/auth/magic-link/consume", () =>
      new HttpResponse(null, { status: 200 }),
    ),
  );
  wrap("/auth/consume?token=magic123&return_to=//evil.com/steal");
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
  await waitFor(() => expect(screen.getByTestId("tenants")).toBeInTheDocument());
});

test("shows error when token is missing", () => {
  wrap("/auth/consume");
  expect(screen.getByRole("alert")).toHaveTextContent(/missing/i);
});

test("shows error when consume fails", async () => {
  server.use(
    http.post("https://auth.floofpark.app/api/v1/auth/magic-link/consume", () =>
      new HttpResponse(null, { status: 400 }),
    ),
  );
  wrap("/auth/consume?token=bad");
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/400/));
});

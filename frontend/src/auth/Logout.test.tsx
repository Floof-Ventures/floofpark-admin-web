import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { Logout } from "./Logout";

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("renders a Sign out button", () => {
  render(<Logout />);
  expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
});

test("clicking POSTs to /api/v1/auth/logout with credentials:include, then assigns /login", async () => {
  const original = window.location;
  const assignMock = vi.fn();
  // @ts-expect-error
  delete window.location;
  // @ts-expect-error
  window.location = { ...original, assign: assignMock };

  let capturedCredentials: string | undefined;
  server.use(
    http.post("https://auth.floofpark.app/api/v1/auth/logout", ({ request }) => {
      capturedCredentials = request.credentials;
      return new HttpResponse(null, { status: 204 });
    }),
  );

  render(<Logout />);
  await userEvent.click(screen.getByRole("button", { name: /sign out/i }));
  await waitFor(() => expect(assignMock).toHaveBeenCalledWith("/login"));
  expect(capturedCredentials).toBe("include");

  // @ts-expect-error restore
  window.location = original;
});

test("assigns /login even when logout fetch fails", async () => {
  const original = window.location;
  const assignMock = vi.fn();
  // @ts-expect-error
  delete window.location;
  // @ts-expect-error
  window.location = { ...original, assign: assignMock };

  server.use(
    http.post("https://auth.floofpark.app/api/v1/auth/logout", () =>
      new HttpResponse(null, { status: 500 }),
    ),
  );

  render(<Logout />);
  await userEvent.click(screen.getByRole("button", { name: /sign out/i }));
  await waitFor(() => expect(assignMock).toHaveBeenCalledWith("/login"));

  // @ts-expect-error restore
  window.location = original;
});

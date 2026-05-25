import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { LoginPage } from "./LoginPage";

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("submitting a valid email posts to magic-link/request with admin host", async () => {
  let body: Record<string, unknown> | null = null;
  server.use(
    http.post("https://auth.floofpark.com/api/v1/auth/magic-link/request", async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({ delivery: "sent" });
    }),
  );
  render(<LoginPage />);
  await userEvent.type(screen.getByLabelText(/email/i), "zi@floof.ventures");
  await userEvent.click(screen.getByRole("button", { name: /send magic link/i }));
  expect(await screen.findByText(/check your inbox/i)).toBeInTheDocument();
  expect(body).toEqual({ email: "zi@floof.ventures", redirect_to_host: "admin.floofpark.com" });
});

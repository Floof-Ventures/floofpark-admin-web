import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { CreateTenantForm } from "./CreateTenantForm";

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const noop = () => {};

test("renders all required fields", () => {
  wrap(<CreateTenantForm onClose={noop} onCreated={noop} />);
  expect(screen.getByText(/Create Business Tenant/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Legal name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Display name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Slug/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Owner email/i)).toBeInTheDocument();
  // all 8 categories rendered
  for (const c of [
    "Daycare",
    "Boarding",
    "Grooming",
    "Training",
    "Space booking",
    "Retail",
    "Rental",
    "Custom",
  ]) {
    expect(screen.getByLabelText(c)).toBeInTheDocument();
  }
});

test("auto-derives slug from display name; user override sticks", async () => {
  wrap(<CreateTenantForm onClose={noop} onCreated={noop} />);
  const display = screen.getAllByRole("textbox")[1] as HTMLInputElement;
  const slug = screen.getAllByRole("textbox")[2] as HTMLInputElement;
  await userEvent.type(display, "Pawsome Park & Co!");
  expect(slug.value).toBe("pawsome-park-co");
  await userEvent.clear(slug);
  await userEvent.type(slug, "custom-slug");
  // typing in display after override should NOT clobber
  await userEvent.type(display, " 2");
  expect(slug.value).toBe("custom-slug");
});

test("validates required fields on submit", async () => {
  wrap(<CreateTenantForm onClose={noop} onCreated={noop} />);
  await userEvent.click(screen.getByRole("button", { name: /create tenant/i }));
  // Required field errors surface
  const alerts = screen.getAllByRole("alert");
  // legal_name, display_name, slug, categories, invite_owner_email
  expect(alerts.length).toBeGreaterThanOrEqual(5);
});

test("rejects email over 36 chars (users.id cap)", async () => {
  wrap(<CreateTenantForm onClose={noop} onCreated={noop} />);
  const inputs = screen.getAllByRole("textbox");
  await userEvent.type(inputs[0], "Acme LLC");
  await userEvent.type(inputs[1], "Acme");
  // slug auto-derives
  await userEvent.click(screen.getByLabelText("Daycare"));
  // The email input has maxLength=36 so the browser caps it during typing.
  // To assert our validation message, write via fireEvent-style direct set:
  const emailInput = screen.getByLabelText(/Owner email/i) as HTMLInputElement;
  emailInput.removeAttribute("maxLength");
  await userEvent.type(emailInput, "way-too-long-email-37chars-aaaa@example.com");
  await userEvent.click(screen.getByRole("button", { name: /create tenant/i }));
  expect(
    screen.getByText(/Owner email must be ≤ 36 chars/i),
  ).toBeInTheDocument();
});

test("rejects invalid email format", async () => {
  wrap(<CreateTenantForm onClose={noop} onCreated={noop} />);
  const inputs = screen.getAllByRole("textbox");
  await userEvent.type(inputs[0], "Acme LLC");
  await userEvent.type(inputs[1], "Acme");
  await userEvent.click(screen.getByLabelText("Daycare"));
  await userEvent.type(screen.getByLabelText(/Owner email/i), "not-an-email");
  await userEvent.click(screen.getByRole("button", { name: /create tenant/i }));
  expect(screen.getByText(/valid email/i)).toBeInTheDocument();
});

test("submits with multi-select categories and calls onCreated/onClose", async () => {
  let bodyReceived: Record<string, unknown> | null = null;
  server.use(
    http.post(
      "https://tenants.floofpark.app/api/v1/tenants",
      async ({ request }) => {
        bodyReceived = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: "new-tenant",
          display_name: "Pawsome",
          type: "business",
          slug: "pawsome",
          legal_name: "Pawsome LLC",
          state: "active",
          suspension_causes: [],
          suspended_until: null,
          suspension_reason: null,
          created_at: "2026-05-23T00:00:00",
        });
      },
    ),
  );
  const onClose = vi.fn();
  const onCreated = vi.fn();
  wrap(<CreateTenantForm onClose={onClose} onCreated={onCreated} />);
  const inputs = screen.getAllByRole("textbox");
  await userEvent.type(inputs[0], "Pawsome LLC");
  await userEvent.type(inputs[1], "Pawsome");
  await userEvent.click(screen.getByLabelText("Daycare"));
  await userEvent.click(screen.getByLabelText("Boarding"));
  await userEvent.type(screen.getByLabelText(/Owner email/i), "owner@px.co");
  await userEvent.click(screen.getByRole("button", { name: /create tenant/i }));

  await waitFor(() => expect(onCreated).toHaveBeenCalled());
  expect(onClose).toHaveBeenCalled();
  expect(bodyReceived).toMatchObject({
    type: "business",
    legal_name: "Pawsome LLC",
    display_name: "Pawsome",
    slug: "pawsome",
    invite_owner_email: "owner@px.co",
    metadata: { business_categories: ["daycare", "boarding"] },
  });
});

test("surfaces 4xx error message", async () => {
  server.use(
    http.post(
      "https://tenants.floofpark.app/api/v1/tenants",
      () =>
        new HttpResponse(JSON.stringify({ detail: "slug_taken" }), {
          status: 409,
        }),
    ),
  );
  wrap(<CreateTenantForm onClose={noop} onCreated={noop} />);
  const inputs = screen.getAllByRole("textbox");
  await userEvent.type(inputs[0], "X");
  await userEvent.type(inputs[1], "X");
  await userEvent.click(screen.getByLabelText("Daycare"));
  await userEvent.type(screen.getByLabelText(/Owner email/i), "o@p.co");
  await userEvent.click(screen.getByRole("button", { name: /create tenant/i }));
  await waitFor(() =>
    expect(screen.getByText(/Failed to create tenant/i)).toBeInTheDocument(),
  );
});

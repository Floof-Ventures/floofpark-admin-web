import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { AppShell } from "./AppShell";

test("renders FloofPark wordmark with Admin chip and slots children", () => {
  render(
    <AppShell>
      <div data-testid="page">page</div>
    </AppShell>,
  );
  expect(screen.getByText("FloofPark")).toBeInTheDocument();
  expect(screen.getByText(/admin/i)).toBeInTheDocument();
  expect(screen.getByTestId("page")).toBeInTheDocument();
});

test("renders the Sign out button in the header by default (authenticated)", () => {
  render(
    <AppShell>
      <div>children</div>
    </AppShell>,
  );
  expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
});

test("hides the Sign out button when authenticated=false", () => {
  render(
    <AppShell authenticated={false}>
      <div>children</div>
    </AppShell>,
  );
  expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
});

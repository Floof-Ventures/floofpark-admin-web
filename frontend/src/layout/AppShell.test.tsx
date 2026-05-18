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

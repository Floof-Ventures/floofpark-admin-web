import { render, screen } from "@testing-library/react";
import { App } from "./App";

test("renders the shell wordmark", () => {
  render(<App />);
  expect(screen.getByTestId("root-shell")).toHaveTextContent("FloofPark Admin");
});

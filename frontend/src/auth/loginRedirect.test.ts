import { expect, test, vi } from "vitest";
import { redirectToLogin } from "./loginRedirect";

test("redirectToLogin navigates to the magic-link request page with return_to", () => {
  const original = window.location;
  const assignMock = vi.fn();
  // @ts-expect-error overriding for test
  delete window.location;
  // @ts-expect-error simplified mock
  window.location = { ...original, assign: assignMock, href: "https://admin.floofpark.com/tenants" };
  redirectToLogin();
  expect(assignMock).toHaveBeenCalledTimes(1);
  const target = assignMock.mock.calls[0][0] as string;
  expect(target).toContain("/login");
  expect(target).toContain("return_to=" + encodeURIComponent("https://admin.floofpark.com/tenants"));
  // @ts-expect-error restore
  window.location = original;
});

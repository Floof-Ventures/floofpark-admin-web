import { expect, test } from "@playwright/test";

const SUPERADMIN_TOKEN = process.env.SUPERADMIN_ACCESS_TOKEN;

test.describe("Wave 0 happy path", () => {
  test("unauthenticated visitor lands on login page", async ({ page, context }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      try { localStorage.removeItem("floofpark_admin_access_token"); } catch {}
    });
    await page.goto("/tenants");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByText("FloofPark")).toBeVisible();
  });

  test("magic-link consume page renders sign-in button", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/auth/consume?token=test-token-value");
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(page.getByText(/this link expires/i)).toBeVisible();
  });

  test("superadmin lands on tenants list, can open a tenant", async ({ page }) => {
    test.skip(!SUPERADMIN_TOKEN, "SUPERADMIN_ACCESS_TOKEN env not set");
    await page.addInitScript((tok) => {
      localStorage.setItem("floofpark_admin_access_token", tok);
    }, SUPERADMIN_TOKEN!);
    await page.goto("/tenants");
    await expect(page.getByRole("heading", { name: /tenants/i })).toBeVisible({ timeout: 15_000 });
    const firstTenantLink = page.locator("table tbody tr a").first();
    await expect(firstTenantLink).toBeVisible();
    await firstTenantLink.click();
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.getByText(/members coming in wave 0\.5/i)).toBeVisible();
  });
});

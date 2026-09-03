import { expect, test, type Page } from "@playwright/test";

const adminRoutes = ["/admin/versions", "/admin/analytics", "/admin/traffic"] as const;

async function adminLogin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Password").fill("e2e-admin");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Funnel versions")).toBeVisible();
}

test.describe("admin route smoke", () => {
  test("authenticated admin pages respond with HTTP 200", async ({ page }) => {
    await adminLogin(page);

    for (const path of adminRoutes) {
      const response = await page.goto(path);
      expect(response, `expected navigation response for ${path}`).not.toBeNull();
      expect(response?.status(), `expected ${path} to return 200`).toBe(200);
    }
  });
});

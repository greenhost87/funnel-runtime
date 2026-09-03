import { expect, test, type Page } from "@playwright/test";

async function adminLogin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Password").fill("e2e-admin");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Funnel versions")).toBeVisible();
}

test.describe("admin date input", () => {
  test("opens bulma calendar on analytics and traffic pages", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(message.text());
      }
    });

    await adminLogin(page);

    for (const path of ["/admin/traffic", "/admin/analytics"] as const) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(errors, `page errors after ${path}: ${errors.join("; ")}`).toEqual([]);

      const pageTitle = path === "/admin/analytics" ? "Analytics dashboard" : "Test traffic";
      await expect(page.getByRole("heading", { name: pageTitle })).toBeVisible({ timeout: 10_000 });

      const dateControl = page.locator(".datetimepicker-dummy-wrapper").first();
      await expect(dateControl).toBeVisible({ timeout: 15_000 });
      await dateControl.click();
      await expect(page.locator(".datepicker.is-active")).toBeVisible();
    }
  });
});

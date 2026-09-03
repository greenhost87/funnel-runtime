import { expect, test, type Page } from "@playwright/test";

async function adminLogin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Password").fill("e2e-admin");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Funnel versions")).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
}

test.describe("admin mobile layout at 320px", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("login and admin pages fit the viewport without horizontal scroll", async ({ page }) => {
    await page.goto("/admin/login");
    await expectNoHorizontalOverflow(page);
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();

    await adminLogin(page);
    await expectNoHorizontalOverflow(page);
    await expect(page.getByRole("navigation", { name: "Admin navigation" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();

    for (const path of ["/admin/analytics", "/admin/traffic"]) {
      await page.goto(path);
      await expectNoHorizontalOverflow(page);
      await expect(page.getByRole("navigation", { name: "Admin navigation" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
    }
  });

  test("compact nav expands into a drawer with visible labels", async ({ page }) => {
    await adminLogin(page);

    await expect(page.locator(".admin-nav")).toHaveClass(/admin-nav--collapsed/);
    await expect(page.locator(".admin-nav__label").filter({ hasText: "Versions" })).toBeHidden();
    await page.getByRole("button", { name: "Expand navigation" }).click();
    await expect(page.locator(".admin-nav__label").filter({ hasText: "Versions" })).toBeVisible();
    await expect(page.locator(".admin-nav__label").filter({ hasText: "Analytics" })).toBeVisible();
    await expect(page.locator(".admin-nav__label").filter({ hasText: "Traffic" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("analytics tables render stacked rows on narrow screens", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/traffic");
    await expect(page.locator("#date")).toHaveValue(/\d{4}-\d{2}-\d{2}/);
    await page.locator("#sessionPreset").selectOption("100");
    await page.getByRole("button", { name: "Generate traffic" }).click();
    await expect(
      page.getByText(/Generated \d+ synthetic sessions for \d{4}-\d{2}-\d{2}\./),
    ).toBeVisible({ timeout: 30_000 });

    await page.goto("/admin/analytics");
    await expect(page.getByText("Primary metric: CTA-from-start conversion")).toBeVisible();
    await page.getByRole("button", { name: /Step funnel/i }).click();
    await expect(page.locator(".dt [data-label]").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

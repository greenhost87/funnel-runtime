import { expect, test, type Page } from "@playwright/test";

async function adminLogin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Password").fill("e2e-admin");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Funnel versions")).toBeVisible();
}

async function expectCenteredInNav(page: Page, selector: string) {
  const alignment = await page.locator(selector).evaluate((element) => {
    const nav = element.closest(".admin-nav");
    if (!(nav instanceof HTMLElement) || !(element instanceof HTMLElement)) {
      return null;
    }

    const navRect = nav.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const navCenter = navRect.left + navRect.width / 2;
    const elementCenter = elementRect.left + elementRect.width / 2;

    return {
      delta: Math.abs(elementCenter - navCenter),
      navWidth: navRect.width,
      elementWidth: elementRect.width,
    };
  });

  expect(alignment).not.toBeNull();
  expect(alignment?.delta ?? Number.POSITIVE_INFINITY).toBeLessThan(2);
  expect(alignment?.elementWidth ?? 0).toBeLessThanOrEqual(alignment?.navWidth ?? 0);
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

  test("compact nav centers icon controls inside the sidebar", async ({ page }) => {
    await adminLogin(page);

    await expect(page.locator(".admin-nav")).toHaveClass(/admin-nav--collapsed/);

    for (const selector of [
      ".admin-nav__toggle",
      ".admin-nav__link[href='/admin/versions']",
      ".admin-nav__link[href='/admin/analytics']",
      ".admin-nav__link[href='/admin/traffic']",
      ".admin-nav__theme",
      ".admin-nav__link--logout",
    ]) {
      await expectCenteredInNav(page, selector);
    }

    await expectNoHorizontalOverflow(page);
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
    await page.getByRole("button", { name: "Generate traffic" }).click();
    await expect(
      page.getByText(/Generated \d+ synthetic sessions for \d{4}-\d{2}-\d{2}\./),
    ).toBeVisible();

    await page.goto("/admin/analytics");
    await expect(page.getByText("Primary metric: CTA-from-start conversion")).toBeVisible();
    await page.getByRole("button", { name: /Step funnel/i }).click();
    await expect(page.locator(".dt [data-label]").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

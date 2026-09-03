import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

test.describe("funnel runtime e2e", () => {
  test("dynamic funnel flow with events and variant differences", async ({ page }) => {
    const events: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/events") && request.method() === "POST") {
        events.push("events-batch");
      }
    });

    await page.goto("/?variant=A&utm_campaign=e2e-a");
    await page.waitForResponse((response) => response.url().includes("/api/funnel/session"));
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Discover your personalized wellness roadmap",
    );

    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByText("Boost daily energy and focus").click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByText("Nutrition and meal planning").click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByLabel("Monthly budget for wellness products and services (USD)").fill("150");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByText("Within 1 month").click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Your comprehensive wellness plan is ready")).toBeVisible();
    await page.getByRole("button", { name: "Get my full plan" }).click();

    await page.context().clearCookies();
    await page.goto("/?variant=B&utm_campaign=e2e-b");
    await page.waitForResponse((response) => response.url().includes("/api/funnel/session"));
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Pick your #1 goal");
    expect(events.length).toBeGreaterThan(0);
  });

  test("admin publication and analytics", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Password").fill("e2e-admin");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Funnel versions")).toBeVisible();

    const iterationConfig = readFileSync(
      join(process.cwd(), "fixtures/funnels/iteration-2.json"),
      "utf8",
    );
    await page.setInputFiles('input[type="file"]', {
      name: "iteration-2.json",
      mimeType: "application/json",
      buffer: Buffer.from(iterationConfig),
    });
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByText("Config ID: wellness-quiz-v2")).toBeVisible();

    await page.goto("/admin/analytics");
    await expect(page.getByText("Primary metric: CTA-from-start conversion")).toBeVisible();
  });

  test("mobile layout at 320px has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/");
    await page.waitForResponse((response) => response.url().includes("/api/funnel/session"));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > 320);
    expect(overflow).toBe(false);
    await expect(page.getByRole("button", { name: /Continue|Next/ })).toBeVisible();
  });
});

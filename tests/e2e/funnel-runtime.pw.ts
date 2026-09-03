import { expect, test, type Page, type Request } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as v from "valibot";

const EventBatchPayloadSchema = v.object({
  events: v.array(
    v.object({
      eventId: v.string(),
      eventName: v.string(),
      transitionId: v.optional(v.string()),
      stepId: v.optional(v.string()),
    }),
  ),
});

const SessionPayloadSchema = v.object({
  sessionId: v.string(),
});

type EventBatchPayload = v.InferOutput<typeof EventBatchPayloadSchema>;

const EventBatchPayloadParser = v.pipe(v.unknown(), EventBatchPayloadSchema);

function collectEventBatches(page: Page) {
  const batches: EventBatchPayload[] = [];
  page.on("request", (request: Request) => {
    if (request.url().includes("/api/events") && request.method() === "POST") {
      const parsed = v.safeParse(EventBatchPayloadParser, request.postDataJSON());
      if (parsed.success) {
        batches.push(parsed.output);
      }
    }
  });
  return batches;
}

function eventNames(batches: EventBatchPayload[]): string[] {
  return batches.flatMap((batch) => batch.events.map((event) => event.eventName));
}

const SESSION_READY_TIMEOUT = 30_000;

async function waitForSessionResponse(page: Page) {
  return page.waitForResponse(
    (response) => response.url().includes("/api/funnel/session") && response.ok(),
    { timeout: SESSION_READY_TIMEOUT },
  );
}

async function openFunnel(page: Page, path: string) {
  const sessionReady = waitForSessionResponse(page);
  await page.goto(path);
  await sessionReady;
}

async function openFunnelWithSession(page: Page, path: string) {
  const sessionReady = waitForSessionResponse(page);
  await page.goto(path);
  return sessionReady;
}

async function reloadFunnel(page: Page) {
  const sessionReady = waitForSessionResponse(page);
  await page.reload();
  await sessionReady;
}

async function adminLogin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Password").fill("e2e-admin");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Funnel versions")).toBeVisible();
}

async function advanceVariantAFunnel(page: Page) {
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
}

test.describe("funnel runtime e2e", () => {
  test("dynamic funnel flow with event emission and experiment variants", async ({ page }) => {
    const batches = collectEventBatches(page);

    await openFunnel(page, "/?variant=A&utm_campaign=e2e-a");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Discover your personalized wellness roadmap",
    );

    await advanceVariantAFunnel(page);
    await expect(page.getByText("Your comprehensive wellness plan is ready")).toBeVisible();
    await page.getByRole("button", { name: "Get my full plan" }).click();

    const names = eventNames(batches);
    expect(names).toContain("session_started");
    expect(names).toContain("step_viewed");
    expect(names).toContain("answer_submitted");
    expect(names).toContain("step_completed");
    expect(names).toContain("result_viewed");
    expect(names).toContain("cta_clicked");

    const infoCompletion = batches
      .flatMap((batch) => batch.events)
      .find((event) => event.eventName === "step_completed" && event.stepId === "welcome");
    const infoBatch = batches.find((batch) =>
      batch.events.some(
        (event) => event.eventName === "answer_submitted" && event.stepId === "welcome",
      ),
    );
    expect(infoCompletion?.transitionId).toBeTruthy();
    expect(infoBatch).toBeUndefined();

    await page.context().clearCookies();
    await openFunnel(page, "/?variant=B&utm_campaign=e2e-b");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Pick your #1 goal");
    await page.getByText("Boost daily energy and focus").click();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "How soon do you want results?",
    );
    await page.getByText("Within 1 month").click();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("What needs work?");
  });

  test("refresh, back navigation, and validation", async ({ page }) => {
    await openFunnel(page, "/?variant=A");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(
      page.getByText(/Answer must be a string option id|Selection is required/i),
    ).toBeVisible();

    await page.getByText("Build strength and endurance").click();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "How often do you currently exercise?",
    );

    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "What is your primary wellness goal",
    );

    await reloadFunnel(page);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "What is your primary wellness goal",
    );
  });

  test("session_started is retried until accepted and not resent afterward", async ({ page }) => {
    let sessionStartedEventId: string | null = null;
    let sessionStartedPosts = 0;

    await page.route("**/api/events", async (route) => {
      const parsed = v.safeParse(EventBatchPayloadParser, route.request().postDataJSON());
      if (!parsed.success) {
        await route.continue();
        return;
      }
      const body = parsed.output;
      const started = body.events.find((event) => event.eventName === "session_started");
      if (started) {
        sessionStartedEventId = started.eventId;
        sessionStartedPosts += 1;
        if (sessionStartedPosts <= 2) {
          await route.abort("failed");
          return;
        }
      }
      await route.continue();
    });

    await openFunnel(page, "/?variant=A");
    await expect.poll(() => sessionStartedPosts).toBe(2);
    expect(sessionStartedEventId).toBeTruthy();

    await reloadFunnel(page);
    await expect.poll(() => sessionStartedPosts).toBeGreaterThanOrEqual(3);
    await page.waitForTimeout(500);
    const afterRecovery = sessionStartedPosts;

    await reloadFunnel(page);
    await page.waitForTimeout(500);
    expect(sessionStartedPosts).toBe(afterRecovery);
  });

  test("admin publication, analytics, and rollback", async ({ page }) => {
    const eventsReady = page.waitForResponse(
      (response) =>
        response.url().includes("/api/events") && response.request().method() === "POST",
      { timeout: SESSION_READY_TIMEOUT },
    );
    await openFunnel(page, "/?variant=A");
    await eventsReady;
    await page.getByRole("button", { name: "Continue" }).click();

    await adminLogin(page);
    await page.goto("/admin/analytics");
    await expect(page.getByText("Primary metric: CTA-from-start conversion")).toBeVisible();
    const startedBefore = await page
      .locator(".analytics-card")
      .filter({ hasText: "Sessions started" })
      .locator(".analytics-card__value")
      .textContent();
    expect(Number(startedBefore ?? 0)).toBeGreaterThanOrEqual(1);

    await page.goto("/admin/versions");
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

    await page.getByRole("button", { name: "Rollback" }).first().click();
    await expect(page.getByText("Config ID: wellness-quiz-v1")).toBeVisible();

    await page.goto("/admin/analytics");
    const startedAfter = await page
      .locator(".analytics-card")
      .filter({ hasText: "Sessions started" })
      .locator(".analytics-card__value")
      .textContent();
    expect(startedAfter).toBe(startedBefore);
  });

  test("second iteration keeps old sessions pinned and starts new sessions on active version", async ({
    page,
    browser,
  }) => {
    await openFunnel(page, "/?variant=A");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "What is your primary wellness goal",
    );
    const oldHeading = await page.getByRole("heading", { level: 1 }).textContent();

    await adminLogin(page);
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

    const oldContext = page.context();
    const oldPage = await oldContext.newPage();
    await openFunnel(oldPage, "/");
    await expect(oldPage.getByRole("heading", { level: 1 })).toHaveText(oldHeading ?? "");

    const newContext = await browser.newContext();
    const newPage = await newContext.newPage();
    const sessionResponse = await openFunnelWithSession(newPage, "/?variant=A");
    const sessionPayload = v.parse(SessionPayloadSchema, await sessionResponse.json());
    const sessionId = sessionPayload.sessionId;
    await expect(newPage.getByRole("heading", { level: 1 })).toContainText(
      "Discover your personalized wellness roadmap",
    );
    await newPage.getByRole("button", { name: "Continue" }).click();
    await expect(newPage.getByRole("heading", { level: 1 })).toContainText(
      "What is your primary wellness goal for the next 90 days?",
    );
    await newPage.getByText("Premium coaching program").click();
    await newPage.getByRole("button", { name: "Next" }).click();
    await expect(newPage.getByRole("heading", { level: 1 })).toContainText(
      "Premium coaching overview",
    );

    const customEventResponse = await newPage.request.post("/api/events", {
      data: {
        events: [
          {
            eventId: crypto.randomUUID(),
            eventName: "premium_interest_signal",
            sessionId,
            clientTimestamp: new Date().toISOString(),
            stepId: "goal",
          },
        ],
      },
    });
    expect(customEventResponse.ok()).toBe(true);
    const CustomEventResponseSchema = v.object({
      results: v.array(v.object({ status: v.string() })),
    });
    const customPayload = v.parse(CustomEventResponseSchema, await customEventResponse.json());
    expect(customPayload.results[0]?.status).toBe("accepted");

    const variantBContext = await browser.newContext();
    const variantBPage = await variantBContext.newPage();
    await openFunnel(variantBPage, "/?variant=B");
    await variantBPage.getByText("Premium coaching program").click();
    await variantBPage.getByRole("button", { name: "Next" }).click();
    await expect(variantBPage.getByRole("heading", { level: 1 })).toContainText(
      "When would you like to see meaningful results?",
    );
    await variantBPage.getByText("Within 1 month").click();
    await variantBPage.getByRole("button", { name: "Next" }).click();
    await variantBPage.getByText("Nutrition and meal planning").click();
    await variantBPage.getByRole("button", { name: "Next" }).click();
    await variantBPage
      .getByLabel("Monthly budget for wellness products and services (USD)")
      .fill("100");
    await variantBPage.getByRole("button", { name: "Next" }).click();
    await variantBPage.getByRole("button", { name: "Continue" }).click();
    await expect(variantBPage.getByText("Your fast-track wellness wins")).toBeVisible();
    await variantBContext.close();
  });

  test("admin routes require authentication", async ({ page }) => {
    await page.goto("/admin/versions");
    await expect(page).toHaveURL(/\/admin\/login/);

    const response = await page.request.get("/api/admin/versions");
    expect(response.status()).toBe(401);
  });

  test("mobile layout at 320px has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.context().clearCookies();
    await openFunnel(page, "/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > 320);
    expect(overflow).toBe(false);
    await expect(page.getByRole("button", { name: /Continue|Next/ })).toBeVisible();
  });
});

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("dashboard loads, moves, and uses local autopilot without an API call", async ({
  page,
}) => {
  const requests = [];
  const consoleErrors = [];
  await page.addInitScript(() => {
    Math.random = () => 1;
  });
  page.on("request", (request) => requests.push(request.url()));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.goto("./");

  await expect(page.getByRole("heading", { name: "Chart the red frontier." })).toBeVisible();
  await expect(page.getByText("100 / 100")).toBeVisible();

  const coordinates = page.locator("#coordinates");
  await page.evaluate(() => {
    window.__arrowPrevented = false;
    document.addEventListener("keydown", (event) => {
      if (event.key.startsWith("Arrow")) {
        window.__arrowPrevented = event.defaultPrevented;
      }
    });
  });
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#status-message")).toContainText("Pass");
  await expect(coordinates).toHaveText("X: 5 / Y: 4");
  await expect(page.locator("#fuel-value")).toHaveText("99 / 100");
  expect(await page.evaluate(() => window.__arrowPrevented)).toBe(true);

  await page.locator("#grid-width").fill("4");
  await page.locator("#grid-height").fill("5");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(coordinates).toHaveText("X: 2 / Y: 2");
  await expect(page.locator('[role="gridcell"]')).toHaveCount(20);
  await page.getByRole("heading", { name: "Chart the red frontier." }).click();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#status-message")).toContainText("Warning");
  await expect(coordinates).toHaveText("X: 3 / Y: 2");
  await expect(page.locator("#fuel-value")).toHaveText("89 / 100");

  await page.getByRole("button", { name: "New Map" }).click();
  await expect(coordinates).toHaveText("X: 2 / Y: 2");
  await expect(page.locator("#fuel-value")).toHaveText("100 / 100");
  await expect(page.locator("#status-message")).toHaveText("Ready");

  const autopilot = page.getByRole("button", { name: "Run Autopilot" });
  for (let attempt = 0; attempt < 5 && (await autopilot.isDisabled()); attempt += 1) {
    await page.getByRole("button", { name: "New Map" }).click();
  }
  await expect(autopilot).toBeEnabled();
  await autopilot.click();
  await expect(page.locator("#agent-state")).toContainText("Verified in-browser", {
    timeout: 20_000,
  });
  expect(requests.some((url) => url.includes("/api/agent/simulate"))).toBe(false);
  expect(consoleErrors).toEqual([]);
});

test("dashboard has no automatically detectable accessibility violations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await expect(page.locator(".holo-card__sweep")).toHaveCSS("animation-name", "none");
});

test("narrow layout does not overflow horizontally", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
  await expect(page.getByRole("button", { name: "New Map" })).toBeVisible();
});

test("accessible 2D grid is revealed when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(type, ...args) {
      if (type === "webgl" || type === "webgl2") return null;
      return original.call(this, type, ...args);
    };
  });
  await page.goto("./");

  await expect(page.locator(".map-stage")).toHaveClass(/is-unavailable/);
  await expect(page.locator("#map-board")).toBeVisible();
  await expect(page.locator('[role="gridcell"]')).toHaveCount(64);
});

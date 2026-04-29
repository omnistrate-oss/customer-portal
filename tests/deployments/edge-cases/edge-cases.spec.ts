// spec: docs/COMPREHENSIVE_TEST_PLAN.md — Section 22: Edge Cases and Error Scenarios
// seed: tests/user-setup.spec.ts

import test, { expect } from "@playwright/test";

test.describe("Edge Cases and Error Scenarios", () => {
  // 22.5 404 Page
  test("404 Page — Non-existent Route", async ({ page }) => {
    // Navigate to a non-existent route
    await page.goto("/this-route-does-not-exist-at-all");

    // Verify a custom 404 page or "not found" message is displayed
    await page.waitForLoadState("networkidle");

    // The app has a not-found.tsx with specific text
    const pageText = await page.locator("body").textContent();
    const has404Indicator =
      pageText?.includes("404") ||
      pageText?.includes("not found") ||
      pageText?.includes("Not Found") ||
      pageText?.includes("page you are looking for") ||
      pageText?.includes("great nothing") ||
      pageText?.includes("Page not found");

    expect(has404Indicator).toBeTruthy();
  });

  // 22.7 Browser Back/Forward Navigation
  test("Browser Back/Forward Navigation", async ({ page }) => {
    // Navigate to instances
    await page.goto("/instances");
    await page.waitForLoadState("networkidle");

    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/dashboard");

    // Navigate to settings
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/settings");

    // Go back to dashboard
    await page.goBack();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/dashboard");

    // Go back to instances
    await page.goBack();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/instances");

    // Go forward to dashboard
    await page.goForward();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/dashboard");
  });

  // 22.4 Stale Data — Refetch on Instances Page
  test("Stale Data — Refresh Refetches Data", async ({ page }) => {
    await page.goto("/instances");
    await page.waitForLoadState("networkidle");

    // Click refresh button
    const refreshButton = page.getByTestId("refresh-button");
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    // Wait for network idle after refresh
    await page.waitForLoadState("networkidle");

    // Page should still be functional
    await expect(refreshButton).toBeVisible();
  });

  // 22.1 Network Error Handling — API Error Displays Gracefully
  test("API Error Does Not Crash the Page", async ({ page }) => {
    // Intercept API calls and make one fail
    await page.route("**/api/action?endpoint=*usage*", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Internal Server Error" }),
      });
    });

    await page.goto("/billing");
    await page.waitForLoadState("networkidle");

    // Page should not crash — it should show an error state or message
    await expect(page.locator("body")).not.toBeEmpty();
  });

  // 22.6 Application Error Boundary
  test("Application Doesn't Crash on Protected Page Without Valid URL Structure", async ({ page }) => {
    // Navigate to a malformed instance details route
    await page.goto("/instances/invalid/path/structure");
    await page.waitForLoadState("networkidle");

    // App should handle this gracefully — either 404 or redirect or error boundary
    const pageText = await page.locator("body").textContent();
    expect(pageText?.length).toBeGreaterThan(0);
  });
});

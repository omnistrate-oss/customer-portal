// spec: docs/COMPREHENSIVE_TEST_PLAN.md — Section 20: Legal / Static Pages
// seed: N/A (public pages, no auth required)

import { test, expect } from "test-fixtures/har-test";
import { PageURLs } from "page-objects/pages";

test.describe("Legal / Static Pages", () => {
  // 20.1 Terms of Use
  test("Terms of Use Page Loads", async ({ page }) => {
    // Navigate to /terms-of-use
    await page.goto(PageURLs.termsOfUse);

    // Verify content is rendered (page doesn't show a blank screen or error)
    await expect(page.locator("body")).not.toBeEmpty();

    // Verify some text content is present on the page
    const textContent = await page.locator("main, [class*='content'], body").textContent();
    expect(textContent?.trim().length).toBeGreaterThan(0);
  });

  // 20.2 Privacy Policy
  test("Privacy Policy Page Loads", async ({ page }) => {
    // Navigate to /privacy-policy
    await page.goto(PageURLs.privacyPolicy);

    // Verify content is rendered
    await expect(page.locator("body")).not.toBeEmpty();

    const textContent = await page.locator("main, [class*='content'], body").textContent();
    expect(textContent?.trim().length).toBeGreaterThan(0);
  });

  // 20.3 Cookie Policy
  test("Cookie Policy Page Loads", async ({ page }) => {
    // Navigate to /cookie-policy
    await page.goto(PageURLs.cookiePolicy);

    // Verify content is rendered
    await expect(page.locator("body")).not.toBeEmpty();

    const textContent = await page.locator("main, [class*='content'], body").textContent();
    expect(textContent?.trim().length).toBeGreaterThan(0);
  });
});

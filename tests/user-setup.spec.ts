import { PageURLs } from "page-objects/pages";
import { SigninPage } from "page-objects/signin-page";
import path from "path";
import { expect, test as setup } from "test-fixtures/har-test";
import { GlobalStateManager } from "test-utils/global-state-manager";
import { UserAPIClient } from "test-utils/user-api-client";

const authFile = path.join(__dirname, "../playwright/auth/user.json");

setup("Authenticate User", async ({ page }) => {
  console.log("Authenticating user");

  const apiClient = new UserAPIClient();
  const signinPage = new SigninPage(page);

  // Register both response waits before login triggers the dashboard requests.
  const [signinResponse, subscriptionsData] = await Promise.all([
    page.waitForResponse(
      (response) => response.request().method() === "POST" && new URL(response.url()).pathname === "/api/signin"
    ),
    page.waitForResponse(
      (response) => {
        const url = new URL(response.url());
        return (
          response.request().method() === "POST" &&
          url.pathname === "/api/action" &&
          url.searchParams.get("endpoint") === "/2022-09-01-00/subscription"
        );
      },
      { timeout: 90_000 }
    ),
    signinPage.signInWithPassword(),
  ]);

  expect(signinResponse.status()).toBe(200);
  expect(subscriptionsData.status()).toBe(200);
  console.log("User signin successful!");

  // Read the httpOnly token from browser cookies (Playwright can access httpOnly cookies)
  const cookies = await page.context().cookies();
  const tokenCookie = cookies.find((c) => c.name === "omnistrate_token");
  if (tokenCookie) {
    GlobalStateManager.setState({ userToken: tokenCookie.value });
  }

  const subscriptions = (await subscriptionsData.json()).subscriptions || [];

  await page.waitForURL(PageURLs.instances);
  await page.context().storageState({ path: authFile });

  // Get the Service Offerings
  const serviceOfferings = await apiClient.listServiceOffering();
  GlobalStateManager.setState({ serviceOfferings, subscriptions });

  console.log("User setup complete!");
});

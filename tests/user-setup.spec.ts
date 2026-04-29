import { PageURLs } from "page-objects/pages";
import { SigninPage } from "page-objects/signin-page";
import path from "path";
import { test as setup } from "test-fixtures/har-test";
import { GlobalStateManager } from "test-utils/global-state-manager";
import { UserAPIClient } from "test-utils/user-api-client";

import { Subscription } from "src/types/subscription";

const authFile = path.join(__dirname, "../playwright/auth/user.json");

setup("Authenticate User", async ({ page }) => {
  console.log("Authenticating user");

  const apiClient = new UserAPIClient();
  const signinPage = new SigninPage(page);

  await signinPage.signInWithPassword();

  // Wait for the signin response — token is now in an httpOnly cookie, not the response body
  await page.waitForResponse((response) => response.url().includes("/api/signin"));
  console.log("User signin successful!");

  // Read the httpOnly token from browser cookies (Playwright can access httpOnly cookies)
  const cookies = await page.context().cookies();
  const tokenCookie = cookies.find((c) => c.name === "omnistrate_token");
  let userToken: string | undefined = undefined;
  if (tokenCookie) {
    userToken = tokenCookie.value;
    GlobalStateManager.setState({ userToken: tokenCookie.value });
  }

  // Intercept the Request to Get Subscriptions
  const subscriptionsWaitResponse = await page.waitForResponse(
    (response) => {
      return (
        response.url() === `${process.env.YOUR_SAAS_DOMAIN_URL}/api/action?endpoint=%2F2022-09-01-00%2Fsubscription`
      );
    },
    { timeout: 60 * 1000 } // Wait for 60 seconds if needed
  );
  await subscriptionsWaitResponse.json();

  await page.waitForURL(PageURLs.instances);
  await page.context().storageState({ path: authFile });

  if (!userToken) {
    throw new Error("User token not found in cookies.");
  }
  const subscriptionsResponse = await page.request.post("/api/action", {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
    data: {
      endpoint: "/2022-09-01-00/subscription",
      method: "GET",
      queryParams: {
        environmentType: process.env.ENVIRONMENT_TYPE,
      },
    },
  });
  if (!subscriptionsResponse.ok()) {
    throw new Error(`Failed to fetch subscriptions: ${subscriptionsResponse.status()}`);
  }
  const subscriptionsApiData = (await subscriptionsResponse.json()) as { subscriptions?: Subscription[] };
  const subscriptions = subscriptionsApiData.subscriptions || [];
  const serviceOfferings = await apiClient.listServiceOffering();
  GlobalStateManager.setState({ serviceOfferings, subscriptions });

  console.log("User setup complete!");
});

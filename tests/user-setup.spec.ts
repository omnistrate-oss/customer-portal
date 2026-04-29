import { test as setup } from "@playwright/test";
import { PageURLs } from "page-objects/pages";
import { SigninPage } from "page-objects/signin-page";
import path from "path";
import { Subscription } from "src/types/subscription";
import { GlobalStateManager } from "test-utils/global-state-manager";
import { UserAPIClient } from "test-utils/user-api-client";

const authFile = path.join(__dirname, "../playwright/auth/user.json");

setup("Authenticate User", async ({ page }) => {
  console.log("Authenticating user");

  const apiClient = new UserAPIClient();
  const signinPage = new SigninPage(page);

  await signinPage.signInWithPassword();

  // Intercept the Request to Get the JWT Token
  const request = await page.waitForResponse((response) => response.url().includes("/api/signin"));
  const response = await request.json();
  console.log("User signin successful!");
  const userToken = response.jwtToken as string;
  GlobalStateManager.setState({ userToken });

  await page.waitForURL(PageURLs.instances);
  await page.context().storageState({ path: authFile });

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
  const subscriptionsData = (await subscriptionsResponse.json()) as { subscriptions?: Subscription[] };
  const subscriptions = subscriptionsData.subscriptions || [];
  const serviceOfferings = await apiClient.listServiceOffering();
  GlobalStateManager.setState({ serviceOfferings, subscriptions });

  console.log("User setup complete!");
});

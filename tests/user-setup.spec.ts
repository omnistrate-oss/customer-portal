import { test as setup } from "@playwright/test";
import { PageURLs } from "page-objects/pages";
import { SigninPage } from "page-objects/signin-page";
import path from "path";
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
  GlobalStateManager.setState({ userToken: response.jwtToken });

  // Intercept the Request to Get Subscriptions
  const subscriptionsData = await page.waitForResponse(
    (response) => {
      return (
        response.url() === `${process.env.YOUR_SAAS_DOMAIN_URL}/api/action?endpoint=%2F2022-09-01-00%2Fsubscription`
      );
    },
    { timeout: 60 * 1000 } // Wait for 60 seconds if needed
  );
  const subscriptions = (await subscriptionsData.json()).subscriptions || [];

  await page.waitForURL(PageURLs.instances);
  await page.context().storageState({ path: authFile });

  // Get the Service Offerings
  const serviceOfferings = await apiClient.listServiceOffering();
  GlobalStateManager.setState({ serviceOfferings, subscriptions });

  console.log("User setup complete!");
});

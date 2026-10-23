import { getNotificationsRoute } from "src/utils/route/access/accessRoute";
import {
  getAccessControlRoute,
  getBillingRoute,
  getCloudAccountsRoute,
  getCustomNetworksRoute,
  getEventsRoute,
  getInstanceSnapshotsRoute,
  getPaymentSettingsRoute,
  getPrivacyPolicyRoute,
  getReleaseHistoryRoute,
  getSettingsRoute,
  getTermsOfUseRoute,
} from "src/utils/routes";

export const PAGE_TITLE_MAP = {
  "/signin": "Sign In",
  "/signup": "Sign Up",
  "/change-password": "Change Password",
  "/reset-password": "Reset Password",
  "/validate-token": "Validate Token",

  [getTermsOfUseRoute()]: "Terms of Use",
  [getPrivacyPolicyRoute()]: "Privacy Policy",

  "/dashboard": "Dashboard",
  "/instances": "Instances",
  [getInstanceSnapshotsRoute()]: "Instance Snapshots",
  [getCloudAccountsRoute({})]: "Cloud Accounts",
  [getCustomNetworksRoute({})]: "Customer Networks",
  [getAccessControlRoute()]: "Access Control",
  [getEventsRoute()]: "Audit Logs",
  [getNotificationsRoute()]: "Alerts",
  [getSettingsRoute()]: "Profile Settings",
  [getBillingRoute()]: "Billing",
  [getPaymentSettingsRoute()]: "Payment Settings",
  "/subscriptions": "Subscriptions",
  "/cost-explorer": "Cost Explorer",
  [getReleaseHistoryRoute()]: "Release History",
};

import { createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_TEST_SERVICE_ID = "s-auth-validation";
export const AUTH_TEST_PLAN_ID = "pt-auth-validation";
export const AUTH_TEST_SUBSCRIPTION_ID = "sub-auth-validation";
export const AUTH_TEST_CUSTOMER_ORG = "org-auth-customer";
export const AUTH_TEST_PROVIDER_ORG = "org-auth-provider";

const TEST_SIGNING_KEY = "synthetic-auth-validation-signing-key-not-a-real-credential";

type TestClaims = {
  exp: number;
  userID: string;
  organizationID: string;
  serviceProviderID: string;
  revoked?: boolean;
};

export const createAuthTestToken = (overrides: Partial<TestClaims> = {}, signingKey = TEST_SIGNING_KEY): string => {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + 3600,
      userID: "user-auth-validation",
      organizationID: AUTH_TEST_CUSTOMER_ORG,
      serviceProviderID: AUTH_TEST_PROVIDER_ORG,
      ...overrides,
    })
  ).toString("base64url");
  const signature = createHmac("sha256", signingKey).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
};

export const verifyAuthTestToken = (token: string): TestClaims | null => {
  try {
    const [header, payload, signature, extra] = token.split(".");
    if (!header || !payload || !signature || extra) return null;
    const expected = createHmac("sha256", TEST_SIGNING_KEY).update(`${header}.${payload}`).digest();
    const supplied = Buffer.from(signature, "base64url");
    if (supplied.length !== expected.length || !timingSafeEqual(new Uint8Array(supplied), new Uint8Array(expected))) {
      return null;
    }
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as TestClaims;
    return claims.exp > Date.now() / 1000 && !claims.revoked ? claims : null;
  } catch {
    return null;
  }
};

export const AUTH_TEST_CUSTOMER_TOKEN = createAuthTestToken({ exp: 4102444800 });
export const AUTH_TEST_REFRESHED_TOKEN = createAuthTestToken({
  exp: 4102444800,
  userID: "user-auth-validation-refreshed",
});
export const AUTH_TEST_PROVIDER_TOKEN = "synthetic-provider-token-not-a-real-credential";
export const AUTH_TEST_REFRESH_TOKEN = "synthetic-refresh-token-not-a-real-credential";

export type BackendReply =
  | { kind: "json"; status: number; body: unknown }
  | { kind: "invalid-json" }
  | { kind: "disconnect" }
  | { kind: "timeout" }
  | { kind: "redirect" };

export type AuthValidationScenario = {
  environment?: "PROD" | "DEV" | "STAGING";
  session?: BackendReply;
  user?: BackendReply;
  offering?: BackendReply;
  subscription?: BackendReply;
  rejectInitialSession?: boolean;
  refreshFails?: boolean;
};

export type AuthValidationRequest = {
  path: string;
  method: string;
  usesCustomerToken: boolean;
  usesRefreshedToken: boolean;
  usesProviderToken: boolean;
};

export type AuthValidationRequests = {
  backend: AuthValidationRequest[];
  portal: { path: string; method: string }[];
};

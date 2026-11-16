import assert from "node:assert/strict";
import http from "node:http";
import test, { after, before, beforeEach } from "node:test";

const resetCalls = [];
const backend = http.createServer((request, response) => {
  let body = "";
  request.on("data", (chunk) => (body += chunk));
  request.on("end", () => {
    const path = request.url.split("?")[0];
    const authorization = request.headers.authorization;
    response.setHeader("Content-Type", "application/json");

    if (path.endsWith("/auth/session")) {
      if (authorization === "Bearer expired") response.statusCode = 401;
      const serviceProviderID = authorization === "Bearer other-org" ? "org-other" : "org-1";
      return response.end(JSON.stringify({ organizationID: "org-1", serviceProviderID }));
    }
    if (path.endsWith("/user")) {
      return response.end(JSON.stringify({ orgId: "org-1", email: "Customer@Example.com" }));
    }
    if (path.endsWith("/customer-reset-password")) resetCalls.push(JSON.parse(body));
    response.end("{}");
  });
});

let handler;

before(async () => {
  await new Promise((resolve) => backend.listen(0, "127.0.0.1", resolve));
  process.env.NEXT_PUBLIC_BACKEND_BASE_DOMAIN = `http://127.0.0.1:${backend.address().port}`;
  process.env.ENVIRONMENT_TYPE = "DEV";
  ({ default: handler } = await import("../pages/api/reset-password.js"));
});

beforeEach(() => {
  resetCalls.length = 0;
  process.env.GOOGLE_RECAPTCHA_SITE_KEY = "site-key";
  process.env.GOOGLE_RECAPTCHA_SECRET_KEY = "secret-key";
});

after(() => backend.close());

const post = async ({ email = "customer@example.com", cookies = {} } = {}) => {
  const result = {};
  const response = {
    status(code) {
      result.status = code;
      return response;
    },
    send(body) {
      result.body = body;
      return response;
    },
    json(body) {
      result.body = body;
      return response;
    },
  };
  await handler({ method: "POST", body: { email }, cookies, get: () => "" }, response);
  return result;
};

const signedIn = { omnistrate_token: "valid", omnistrate_refresh_token: "refresh" };

test("rejects a signed-out request with no reCAPTCHA answer", async () => {
  assert.equal((await post()).status, 500);
  assert.equal(resetCalls.length, 0);
});

test("accepts a signed-in customer asking for their own email", async () => {
  assert.equal((await post({ email: " CUSTOMER@example.com ", cookies: signedIn })).status, 200);
  assert.deepEqual(resetCalls, [{ email: " CUSTOMER@example.com " }]);
});

test("rejects a signed-in customer asking for another email", async () => {
  assert.equal((await post({ email: "victim@example.com", cookies: signedIn })).status, 500);
  assert.equal(resetCalls.length, 0);
});

test("rejects a session from another organization", async () => {
  assert.equal((await post({ cookies: { ...signedIn, omnistrate_token: "other-org" } })).status, 500);
  assert.equal(resetCalls.length, 0);
});

test("answers 401 for an expired session that can be refreshed", async () => {
  assert.equal((await post({ cookies: { ...signedIn, omnistrate_token: "expired" } })).status, 401);
  assert.equal((await post({ cookies: { omnistrate_refresh_token: "refresh" } })).status, 401);
  assert.equal(resetCalls.length, 0);
});

test("rejects an expired session with no refresh cookie", async () => {
  assert.equal((await post({ cookies: { omnistrate_token: "expired" } })).status, 500);
  assert.equal(resetCalls.length, 0);
});

test("needs no session when reCAPTCHA is not configured", async () => {
  delete process.env.GOOGLE_RECAPTCHA_SITE_KEY;
  delete process.env.GOOGLE_RECAPTCHA_SECRET_KEY;
  assert.equal((await post()).status, 200);
  assert.deepEqual(resetCalls, [{ email: "customer@example.com" }]);
});

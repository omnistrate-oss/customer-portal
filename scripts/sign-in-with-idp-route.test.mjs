import assert from "node:assert/strict";
import http from "node:http";
import test, { after, before } from "node:test";

const logins = [];
const backend = http.createServer((request, response) => {
  let body = "";
  request.on("data", (chunk) => (body += chunk));
  request.on("end", () => {
    if (request.url.endsWith("/customer-login-with-identity-provider")) logins.push(JSON.parse(body));
    response.setHeader("Content-Type", "application/json");
    response.end("{}");
  });
});

let handler;

before(async () => {
  await new Promise((resolve) => backend.listen(0, "127.0.0.1", resolve));
  process.env.NEXT_PUBLIC_BACKEND_BASE_DOMAIN = `http://127.0.0.1:${backend.address().port}`;
  process.env.ENVIRONMENT_TYPE = "DEV";
  process.env.YOUR_SAAS_DOMAIN_URL = "https://portal.example.com";
  ({ default: handler } = await import("../pages/api/sign-in-with-idp.js"));
});

after(() => backend.close());

const post = async (body) => {
  const result = {};
  const response = {
    status(code) {
      result.status = code;
      return response;
    },
    send(payload) {
      result.body = payload;
      return response;
    },
  };
  await handler({ method: "POST", body, get: () => "" }, response);
  return result;
};

test("forwards only the fields the sign-in page sends", async () => {
  const result = await post({
    authorizationCode: "code",
    identityProviderName: "Google",
    state: "nonce",
    invitedEmail: "invited@example.com",
    legalCompanyName: "Acme",
    companyUrl: "https://acme.example",
    attributes: { affiliateCode: "AFF1", role: "admin" },
    environmentType: "PROD",
    redirectUri: "https://evil.example/idp-auth",
    companyDescription: "extra",
    token: "extra",
  });

  assert.equal(result.status, 200);
  assert.deepEqual(logins, [
    {
      authorizationCode: "code",
      identityProviderName: "Google",
      state: "nonce",
      invitedEmail: "invited@example.com",
      legalCompanyName: "Acme",
      companyUrl: "https://acme.example",
      environmentType: "DEV",
      redirectUri: "https://portal.example.com/idp-auth",
      attributes: { affiliateCode: "AFF1" },
    },
  ]);
});

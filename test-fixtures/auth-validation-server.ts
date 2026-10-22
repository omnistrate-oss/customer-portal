import type { NextApiRequest, NextApiResponse } from "next";
import { apiResolver } from "next/dist/server/api-utils/node/api-resolver";
import { build } from "esbuild";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import path from "node:path";

import {
  AUTH_TEST_CUSTOMER_ORG,
  AUTH_TEST_CUSTOMER_TOKEN,
  AUTH_TEST_PLAN_ID,
  AUTH_TEST_PROVIDER_ORG,
  AUTH_TEST_PROVIDER_TOKEN,
  AUTH_TEST_REFRESH_TOKEN,
  AUTH_TEST_REFRESHED_TOKEN,
  AUTH_TEST_SERVICE_ID,
  type AuthValidationRequests,
  type AuthValidationScenario,
  type BackendReply,
  verifyAuthTestToken,
} from "./auth-validation-data";

type Handler = (request: NextApiRequest, response: NextApiResponse) => Promise<unknown>;

let scenario: AuthValidationScenario = {};
let requests: AuthValidationRequests = { backend: [], portal: [] };

const json = (response: ServerResponse, status: number, body: unknown): void => {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
};

const respond = (request: IncomingMessage, response: ServerResponse, reply: BackendReply): void => {
  if (reply.kind === "disconnect") {
    request.socket.destroy();
  } else if (reply.kind === "invalid-json") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end("not-json");
  } else if (reply.kind === "redirect") {
    response.writeHead(302, { Location: "/2022-09-01-00/unexpected-redirect" });
    response.end();
  } else if (reply.kind === "json") {
    json(response, reply.status, reply.body);
  }
};

const listen = async (server: Server): Promise<string> => {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing authentication test server address");
  return `http://127.0.0.1:${address.port}`;
};

const backend = createServer((request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  const endpoint = url.pathname.replace("/2022-09-01-00", "");
  const authorization = request.headers.authorization || "";
  const token = authorization.replace(/^Bearer /, "");
  const provider = token === AUTH_TEST_PROVIDER_TOKEN;
  requests.backend.push({
    path: endpoint,
    method: request.method || "GET",
    usesCustomerToken: token === AUTH_TEST_CUSTOMER_TOKEN,
    usesRefreshedToken: token === AUTH_TEST_REFRESHED_TOKEN,
    usesProviderToken: provider,
  });

  if (endpoint === "/auth/session") {
    if (scenario.session) return respond(request, response, scenario.session);
    const claims = verifyAuthTestToken(token);
    if (!claims || (scenario.rejectInitialSession && token !== AUTH_TEST_REFRESHED_TOKEN)) {
      return json(response, 401, { message: "Synthetic authentication rejection" });
    }
    return json(response, 200, claims);
  }
  if (endpoint === "/user") {
    if (!provider && scenario.user) return respond(request, response, scenario.user);
    return json(response, 200, {
      id: "user-auth-validation",
      orgId: provider || scenario.environment !== "PROD" ? AUTH_TEST_PROVIDER_ORG : AUTH_TEST_CUSTOMER_ORG,
      orgName: "Test Provider",
    });
  }
  if (endpoint === "/refresh-token") {
    if (scenario.refreshFails) return json(response, 401, { message: "Synthetic refresh rejection" });
    return json(response, 200, { jwtToken: AUTH_TEST_REFRESHED_TOKEN, refreshToken: AUTH_TEST_REFRESH_TOKEN });
  }
  if (endpoint === "/logout") return json(response, 200, {});
  if (endpoint === `/service-offering/${AUTH_TEST_SERVICE_ID}`) {
    if (scenario.offering) return respond(request, response, scenario.offering);
    return json(response, 200, { offerings: [{ productTierID: AUTH_TEST_PLAN_ID }] });
  }
  if (endpoint.startsWith("/subscription/")) {
    if (scenario.subscription) return respond(request, response, scenario.subscription);
    return json(response, 200, { serviceId: AUTH_TEST_SERVICE_ID, productTierId: AUTH_TEST_PLAN_ID });
  }
  if (!provider) return json(response, 403, { message: "Synthetic provider authorization rejection" });
  if (endpoint === "/cloud-provider") return json(response, 200, { ids: ["cloud-auth-test"] });
  if (endpoint === "/cloud-provider/cloud-auth-test") return json(response, 200, { id: "cloud-auth-test" });
  if (endpoint.endsWith("/resource")) {
    return json(response, 200, { resources: [{ id: "r-auth-test", key: "auth-resource", name: "Auth resource" }] });
  }
  if (endpoint.endsWith("/version-set")) {
    return json(response, 200, { tierVersionSets: [{ version: "1.0", name: "Test release" }] });
  }
  if (endpoint.endsWith(`/product-tier/${AUTH_TEST_PLAN_ID}`)) {
    return json(response, 200, { customMetering: { metrics: [{ name: "requests", aggregationFunction: "sum" }] } });
  }
  return json(response, 404, { message: "Unexpected synthetic backend request" });
});

let portal: Server | undefined;
let stopping = false;

const stop = () => {
  if (stopping) return;
  stopping = true;
  const timer = setTimeout(() => process.exit(1), 1000);
  const servers = [backend, portal].filter((server): server is Server => !!server);
  void Promise.all(
    servers.map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => resolve());
          server.closeAllConnections();
        })
    )
  ).then(() => {
    clearTimeout(timer);
    process.exit(0);
  });
};

process.on("disconnect", stop);
process.on("SIGTERM", stop);
process.on("SIGINT", stop);

const start = async () => {
  const backendURL = await listen(backend);
  if (stopping) return;
  process.env.NEXT_PUBLIC_BACKEND_BASE_DOMAIN = backendURL;
  process.env.ENVIRONMENT_TYPE = "PROD";

  const { setProviderToken } = await import("src/server/providerToken");
  setProviderToken(AUTH_TEST_PROVIDER_TOKEN);

  const handlers: Record<string, Handler> = {
    "/api/resources": (await import("../pages/api/resources")).default,
    "/api/version-sets": (await import("../pages/api/version-sets")).default,
    "/api/cloud-providers": (await import("../pages/api/cloud-providers")).default,
    "/api/product-tier-custom-metrics": (await import("../pages/api/product-tier-custom-metrics")).default,
    "/api/refresh-token": (await import("../pages/api/refresh-token")).default,
    "/api/logout": (await import("../pages/api/logout")).default,
  };

  if (stopping) return;
  let browserBundle: string | undefined;
  portal = createServer((request, response) => {
    const handle = async () => {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      if (url.pathname === "/__auth-test/scenario" && request.method === "POST") {
        const chunks: Uint8Array[] = [];
        for await (const chunk of request) chunks.push(new Uint8Array(Buffer.from(chunk)));
        scenario = JSON.parse(Buffer.concat(chunks).toString()) as AuthValidationScenario;
        process.env.ENVIRONMENT_TYPE = scenario.environment || "PROD";
        scenario.environment = scenario.environment || "PROD";
        requests = { backend: [], portal: [] };
        return json(response, 200, {});
      }
      if (url.pathname === "/__auth-test/requests") return json(response, 200, requests);
      if (url.pathname === "/auth-client.js") {
        if (!browserBundle) {
          const result = await build({
            entryPoints: [path.join(process.cwd(), "test-fixtures/auth-validation-client.tsx")],
            tsconfig: path.join(process.cwd(), "tsconfig.json"),
            bundle: true,
            write: false,
            platform: "browser",
            jsx: "automatic",
            define: {
              "process.env.NODE_ENV": JSON.stringify("production"),
              "process.env.NEXT_PUBLIC_BACKEND_BASE_DOMAIN": JSON.stringify(backendURL),
            },
            plugins: [
              {
                name: "synthetic-auth-data",
                setup(builder) {
                  builder.onLoad({ filter: /auth-validation-data\.ts$/ }, () => ({
                    contents: `export const AUTH_TEST_SERVICE_ID = ${JSON.stringify(AUTH_TEST_SERVICE_ID)};
export const AUTH_TEST_PLAN_ID = ${JSON.stringify(AUTH_TEST_PLAN_ID)};`,
                    loader: "js",
                  }));
                },
              },
            ],
          });
          browserBundle = result.outputFiles[0].text;
        }
        response.writeHead(200, { "Content-Type": "application/javascript" });
        return response.end(browserBundle);
      }
      requests.portal.push({ path: url.pathname, method: request.method || "GET" });
      const handler = handlers[url.pathname];
      if (handler) {
        return apiResolver(
          request,
          response,
          Object.fromEntries(url.searchParams),
          { default: handler },
          { previewModeId: "", previewModeEncryptionKey: "", previewModeSigningKey: "", dev: true },
          false,
          true,
          url.pathname
        );
      }
      if (url.pathname === "/auth-check" || url.pathname === "/signin") {
        response.writeHead(200, { "Content-Type": "text/html" });
        return response.end(
          '<!doctype html><html><head><title>Authentication test</title></head><body><div id="root"></div><script src="/auth-client.js"></script></body></html>'
        );
      }
      return json(response, 404, {});
    };
    void handle().catch(() => json(response, 500, { message: "Authentication test harness failure" }));
  });

  const portalURL = await listen(portal);
  if (stopping || (process.send && !process.connected)) return stop();
  process.send?.({ url: portalURL });
};

if (process.send && !process.connected) {
  stop();
} else {
  void start().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Authentication test harness startup failed");
    process.exit(1);
  });
}

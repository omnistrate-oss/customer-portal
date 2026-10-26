import type { APIRequestContext } from "@playwright/test";
import { fork } from "node:child_process";
import path from "node:path";
import { test as base } from "test-fixtures/har-test";

import type { AuthValidationRequests, AuthValidationScenario } from "./auth-validation-data";
import { stopAuthHarness } from "./auth-validation-process";

type AuthHarness = { url: string };

type AuthServer = AuthHarness & {
  configure: (request: APIRequestContext, scenario: AuthValidationScenario) => Promise<void>;
  requests: (request: APIRequestContext) => Promise<AuthValidationRequests>;
};

export const test = base.extend<{ authServer: AuthServer }, { authHarness: AuthHarness }>({
  harMode: "off",
  authHarness: [
    async ({}, use) => {
      const child = fork(path.join(process.cwd(), "test-fixtures/auth-validation-server.ts"), [], {
        cwd: process.cwd(),
        execArgv: ["--import", "tsx"],
        stdio: ["ignore", "ignore", "pipe", "ipc"],
        env: {
          ...process.env,
          NODE_ENV: "development",
          PROVIDER_EMAIL: "",
          PROVIDER_PASSWORD: "",
          PROVIDER_HASHED_PASS: "",
          USER_EMAIL: "",
          USER_PASSWORD: "",
        },
      });
      let errors = "";
      child.stderr?.on("data", (chunk: Buffer) => {
        errors = (errors + chunk.toString()).slice(-4000);
      });
      try {
        const url = await new Promise<string>((resolve, reject) => {
          const timer = setTimeout(() => {
            cleanup();
            reject(new Error(`Authentication harness startup timed out: ${errors}`));
          }, 30000);
          function cleanup() {
            clearTimeout(timer);
            child.removeListener("error", onError);
            child.removeListener("exit", onExit);
            child.removeListener("message", onMessage);
          }
          function onError(error: Error) {
            cleanup();
            reject(error);
          }
          function onExit() {
            cleanup();
            reject(new Error(`Authentication harness exited before startup: ${errors}`));
          }
          function onMessage(message: unknown) {
            cleanup();
            if (
              typeof message !== "object" ||
              message === null ||
              !("url" in message) ||
              typeof message.url !== "string"
            ) {
              reject(new Error("Invalid authentication harness startup message"));
            } else {
              resolve(message.url);
            }
          }
          child.once("error", onError);
          child.once("exit", onExit);
          child.once("message", onMessage);
        });
        await use({ url });
      } finally {
        await stopAuthHarness(child);
      }
    },
    { scope: "worker" },
  ],
  authServer: async ({ authHarness }, use) => {
    await use({
      ...authHarness,
      configure: async (request, scenario) => {
        const response = await request.post(`${authHarness.url}/__auth-test/scenario`, { data: scenario });
        if (!response.ok()) throw new Error("Failed to configure authentication test backend");
      },
      requests: async (request) => {
        const response = await request.get(`${authHarness.url}/__auth-test/requests`);
        if (!response.ok()) throw new Error("Failed to read authentication test backend requests");
        return (await response.json()) as AuthValidationRequests;
      },
    });
  },
});

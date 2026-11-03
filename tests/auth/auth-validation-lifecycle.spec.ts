import { type ChildProcess, fork } from "node:child_process";
import path from "node:path";
import { AUTH_TEST_CUSTOMER_TOKEN } from "test-fixtures/auth-validation-data";
import { stopAuthHarness } from "test-fixtures/auth-validation-process";
import { expect, test as base } from "test-fixtures/har-test";

type LaunchChild = (source?: string, inline?: boolean) => ChildProcess;

const test = base.extend<{ launchChild: LaunchChild }>({
  harMode: "off",
  launchChild: async ({}, use) => {
    const children: ChildProcess[] = [];
    try {
      await use((source = path.join(process.cwd(), "test-fixtures/auth-validation-server.ts"), inline = false) => {
        const child = fork(inline ? "" : source, [], {
          cwd: process.cwd(),
          execArgv: inline ? ["-e", source] : ["--import", "tsx"],
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
        child.stderr?.resume();
        children.push(child);
        return child;
      });
    } finally {
      await Promise.all(children.map((child) => stopAuthHarness(child)));
    }
  },
});

const waitForMessage = (child: ChildProcess): Promise<unknown> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => onError(new Error("Lifecycle test child startup timed out")), 10000);
    function cleanup() {
      clearTimeout(timer);
      child.removeListener("message", onMessage);
      child.removeListener("error", onError);
      child.removeListener("exit", onExit);
    }
    function onMessage(message: unknown) {
      cleanup();
      resolve(message);
    }
    function onError(error: Error) {
      cleanup();
      reject(error);
    }
    function onExit() {
      onError(new Error("Lifecycle test child exited before sending a message"));
    }
    child.once("message", onMessage);
    child.once("error", onError);
    child.once("exit", onExit);
  });

const waitForExit = async (child: ChildProcess): Promise<void> => {
  await expect.poll(() => child.exitCode !== null || child.signalCode !== null, { timeout: 3000 }).toBe(true);
};

const startHarness = async (launchChild: LaunchChild): Promise<{ child: ChildProcess; url: string }> => {
  const child = launchChild();
  const message = await waitForMessage(child);
  if (typeof message !== "object" || message === null || !("url" in message) || typeof message.url !== "string") {
    throw new Error("Invalid lifecycle test harness URL");
  }
  return { child, url: message.url };
};

test.describe("Authentication harness lifecycle", () => {
  test("force-killing the parent does not orphan the server", async ({ launchChild, request }) => {
    const serverPath = path.join(process.cwd(), "test-fixtures/auth-validation-server.ts");
    const parent = launchChild(
      `const { fork } = require('node:child_process');
const child = fork(${JSON.stringify(serverPath)}, [], { execArgv: ['--import', 'tsx'], stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
child.stderr.resume();
child.once('message', (message) => process.send({ url: message.url, pid: child.pid }));`,
      true
    );
    const message = await waitForMessage(parent);
    if (
      typeof message !== "object" ||
      message === null ||
      !("url" in message) ||
      typeof message.url !== "string" ||
      !("pid" in message) ||
      typeof message.pid !== "number"
    ) {
      throw new Error("Invalid lifecycle test parent message");
    }
    const { url, pid } = message;
    try {
      parent.kill("SIGKILL");
      await waitForExit(parent);
      await expect
        .poll(
          async () => {
            try {
              await request.get(`${url}/__auth-test/requests`, { timeout: 500 });
              return false;
            } catch {
              return true;
            }
          },
          { timeout: 3000 }
        )
        .toBe(true);
      await expect
        .poll(
          () => {
            try {
              process.kill(pid, 0);
              return false;
            } catch {
              return true;
            }
          },
          { timeout: 3000 }
        )
        .toBe(true);
    } finally {
      try {
        process.kill(pid, "SIGKILL");
      } catch {}
    }
  });

  test("parent disconnection during module startup does not leave a server running", async ({ launchChild }) => {
    const serverPath = path.join(process.cwd(), "test-fixtures/auth-validation-server.ts");
    const child = launchChild(
      `require('tsx/cjs'); require(${JSON.stringify(serverPath)}); process.disconnect();`,
      true
    );
    await waitForExit(child);
    expect(child.exitCode).toBe(0);
  });

  test("shutdown closes outstanding backend timeout requests", async ({ launchChild, request }) => {
    const { child, url } = await startHarness(launchChild);
    await request.post(`${url}/__auth-test/scenario`, { data: { session: { kind: "timeout" } } });
    const response = request.get(`${url}/api/cloud-providers`, {
      headers: { Cookie: `omnistrate_token=${AUTH_TEST_CUSTOMER_TOKEN}` },
      timeout: 5000,
    });
    const settledResponse = response.then(
      () => "response",
      () => "disconnected"
    );
    await expect
      .poll(async () => {
        const records = await request.get(`${url}/__auth-test/requests`);
        const body = (await records.json()) as { backend: { path: string }[] };
        return body.backend.some((entry) => entry.path === "/auth/session");
      })
      .toBe(true);
    await stopAuthHarness(child);
    expect(child.exitCode).toBe(0);
    expect(await settledResponse).toBe("disconnected");
  });

  test("unresponsive child is force-killed after the grace period", async ({ launchChild }) => {
    const child = launchChild(
      "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000); process.send('ready');",
      true
    );
    await waitForMessage(child);
    await stopAuthHarness(child, 100, 1000);
    expect(child.signalCode).toBe("SIGKILL");
    expect(child.listenerCount("exit")).toBe(0);
    expect(child.listenerCount("error")).toBe(0);
  });
});

import type { ChildProcess } from "node:child_process";

export const stopAuthHarness = async (
  child: ChildProcess,
  gracefulTimeoutMs = 5000,
  forceKillTimeoutMs = 1000
): Promise<void> => {
  if (child.exitCode !== null || child.signalCode !== null) return;

  await new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout>;
    function cleanup() {
      clearTimeout(timer);
      child.removeListener("exit", onExit);
      child.removeListener("error", onError);
    }
    function onExit() {
      cleanup();
      resolve();
    }
    function onError(error: Error) {
      cleanup();
      reject(error);
    }
    child.once("exit", onExit);
    child.once("error", onError);
    timer = setTimeout(() => {
      timer = setTimeout(() => {
        cleanup();
        reject(new Error("Authentication harness did not exit after SIGKILL"));
      }, forceKillTimeoutMs);
      child.kill("SIGKILL");
    }, gracefulTimeoutMs);
    child.kill("SIGTERM");
  });
};

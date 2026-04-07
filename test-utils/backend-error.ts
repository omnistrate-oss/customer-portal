/**
 * Custom error class for backend infrastructure failures.
 * When thrown, tests should be skipped rather than marked as failed,
 * since the failure is not related to the UI code being tested.
 *
 * IMPORTANT: This file is transitively imported by frontend code
 * (via page-objects). It must NOT import any Node.js-only modules
 * (fs, path) or any module that does — not even dynamically.
 * The soft failure tracker is wired in via setSoftFailureRecorder().
 */

export interface SoftFailureEntry {
  specFile: string;
  testName: string;
  reason: string;
}

/** Pluggable recorder — set by the test environment, absent in the browser. */
let _recorder: ((entry: SoftFailureEntry) => void) | null = null;

/**
 * Register the soft failure recorder. Called once during test setup
 * (in global-setup.ts) to wire in the actual file-writing implementation.
 */
export function setSoftFailureRecorder(fn: (entry: SoftFailureEntry) => void) {
  _recorder = fn;
}

export class BackendError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackendError";
  }
}

/**
 * Tracks whether a beforeAll setup failed due to a backend issue.
 * Used in beforeEach to skip all tests in the suite when setup failed.
 *
 * Usage:
 * ```ts
 * const guard = new BackendSetupGuard("deployments/instances/basic-tests.spec.ts");
 *
 * test.beforeAll(async () => {
 *   try { ... } catch (e) { guard.handleError(e); }
 * });
 *
 * test.beforeEach(async () => {
 *   test.skip(guard.setupFailed, `Skipping: ${guard.failureMessage}`);
 * });
 * ```
 */
export class BackendSetupGuard {
  private error: BackendError | null = null;
  private specFile: string;

  constructor(specFile: string) {
    this.specFile = specFile;
  }

  /** Call in beforeAll's catch block. Re-throws non-backend errors. */
  handleError(error: unknown) {
    if (error instanceof BackendError) {
      this.error = error;
      console.warn(`[BackendSetupGuard] Setup failed due to backend issue: ${error.message}`);
      _recorder?.({
        specFile: this.specFile,
        testName: "beforeAll",
        reason: error.message,
      });
    } else {
      throw error;
    }
  }

  get setupFailed(): boolean {
    return this.error !== null;
  }

  get failureMessage(): string {
    return this.error?.message ?? "";
  }
}

/**
 * Wraps an async function to catch BackendError and skip the test instead of failing.
 * Use in test bodies that call waitForStatus or other backend-dependent operations.
 *
 * Usage:
 * ```ts
 * test("my test", async ({ page }) => {
 *   await skipOnBackendError(test, async () => {
 *     await instancesPage.waitForStatus(instanceId, "Running", logPrefix);
 *   });
 * });
 * ```
 */
export async function skipOnBackendError(
  testFn: {
    skip: (condition: boolean, description: string) => void;
    info: () => { file: string; title: string };
  },
  fn: () => Promise<unknown>
) {
  try {
    await fn();
  } catch (error) {
    if (error instanceof BackendError) {
      if (_recorder) {
        const info = testFn.info();
        _recorder({
          specFile: info.file,
          testName: info.title,
          reason: error.message,
        });
      }
      testFn.skip(true, `Skipping: ${error.message}`);
    } else {
      throw error;
    }
  }
}

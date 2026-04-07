/**
 * Soft Failure Tracker
 *
 * Records backend infrastructure failures during test runs to a JSON file.
 * Used by the CI workflow to detect and report soft failures without
 * blocking merges.
 *
 * The report file is written to `tests/backend-failures.json`.
 *
 * This module is Node.js-only. It must NOT be imported (directly or
 * transitively) by any code that gets bundled by Next.js/webpack.
 * It is wired into backend-error.ts via initSoftFailureTracker().
 */

import * as fs from "fs";
import * as path from "path";

import { setSoftFailureRecorder, type SoftFailureEntry } from "./backend-error";

export interface SoftFailure extends SoftFailureEntry {
  /** ISO timestamp */
  timestamp: string;
}

const REPORT_PATH = path.resolve(__dirname, "../tests/backend-failures.json");
const TESTS_DIR = path.resolve(__dirname, "../tests");

/**
 * Read the current report from disk (or return empty array).
 */
const readReport = (): SoftFailure[] => {
  try {
    if (fs.existsSync(REPORT_PATH)) {
      return JSON.parse(fs.readFileSync(REPORT_PATH, "utf-8"));
    }
  } catch {
    // Corrupted file — start fresh
  }
  return [];
};

/**
 * Append a soft failure to the report file on disk.
 */
const recordSoftFailure = (entry: SoftFailureEntry) => {
  const failures = readReport();

  // Normalize specFile to be relative to tests/
  const specFile = path.isAbsolute(entry.specFile) ? path.relative(TESTS_DIR, entry.specFile) : entry.specFile;

  failures.push({
    specFile,
    testName: entry.testName,
    reason: entry.reason,
    timestamp: new Date().toISOString(),
  });

  const tmpPath = REPORT_PATH + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify(failures, null, 2));
  fs.renameSync(tmpPath, REPORT_PATH);
};

/**
 * Clear any stale report from previous runs.
 * Call once from globalSetup (runs in its own process before workers start).
 */
export const clearSoftFailureReport = () => {
  if (fs.existsSync(REPORT_PATH)) {
    fs.unlinkSync(REPORT_PATH);
  }
};

/**
 * Register the recorder callback in the current process.
 * Call from each worker process (e.g. at module scope in spec files)
 * so that soft failures are actually written to disk.
 */
export const registerSoftFailureRecorder = () => {
  setSoftFailureRecorder(recordSoftFailure);
};

/**
 * Call once during test setup (global-setup.ts) to clear stale reports
 * and register the recorder. Note: the recorder registration only takes
 * effect in the globalSetup process. Workers must call
 * registerSoftFailureRecorder() separately.
 */
export const initSoftFailureTracker = () => {
  clearSoftFailureReport();
  registerSoftFailureRecorder();
};

/**
 * Returns the report file path (for CI workflow to read).
 */
export const SOFT_FAILURE_REPORT_PATH = REPORT_PATH;

import type { FullResult, Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import path from "node:path";

import { restoreRecordings, snapshotRecordings } from "./har-recording-state";

export class HarRecordingReporter implements Reporter {
  private root: string;
  private testsDirectory: string;
  private before: Map<string, Uint8Array>;
  private outcomes = new Map<string, { spec: string; retained: boolean }>();

  constructor(options: { root?: string; testsDirectory?: string } = {}) {
    this.root = options.root ?? path.resolve(__dirname, "../tests/fixtures/hars");
    this.testsDirectory = options.testsDirectory ?? path.resolve(__dirname, "../tests");
    // Reporters are constructed before global setup rewrites its fixture.
    this.before = snapshotRecordings(this.root);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const spec = path.relative(this.testsDirectory, test.location.file).split(path.sep).join("/");
    // A declared skip never recorded anything; only failures and backend skips leave a partial recording.
    const backendSkip =
      result.status === "skipped" &&
      [...(result.annotations ?? []), ...(test.annotations ?? [])].some(
        (annotation) => annotation.type === "skip" && annotation.description?.includes("[backend]")
      );
    this.outcomes.set(test.id, { spec, retained: backendSkip || !["passed", "skipped"].includes(result.status) });
  }

  onEnd(result: FullResult): void {
    const retainedSpecs = new Set([...this.outcomes.values()].filter((test) => test.retained).map((test) => test.spec));
    restoreRecordings(this.root, this.before, retainedSpecs, result.status !== "passed");
  }
}

export default HarRecordingReporter;

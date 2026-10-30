export declare const persistRecordedHar: (
  rawPath: string,
  gzPath: string,
  status: "passed" | "failed" | "timedOut" | "skipped" | "interrupted" | undefined
) => void;

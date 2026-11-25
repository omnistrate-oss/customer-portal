export type SecurityIssue = {
  path: string;
  reason: string;
};
export type HarHeader = {
  name: string;
  value: string;
  [key: string]: unknown;
};
export type HarParam = {
  name: string;
  value?: string;
  [key: string]: unknown;
};
export type HarContent = {
  text?: string;
  mimeType?: string;
  encoding?: "base64";
  size?: number;
  [key: string]: unknown;
};
export type HarPostData = {
  text?: string;
  mimeType?: string;
  encoding?: "base64";
  params?: HarParam[];
  [key: string]: unknown;
};
export type HarRequest = {
  method: string;
  url: string;
  headers?: HarHeader[];
  cookies?: unknown[];
  queryString?: HarParam[];
  postData?: HarPostData;
  [key: string]: unknown;
};
export type HarResponse = {
  status: number;
  statusText?: string;
  headers: HarHeader[];
  cookies?: unknown[];
  content: HarContent;
  bodySize?: number;
  [key: string]: unknown;
};
export type HarEntry = {
  request: HarRequest;
  response: HarResponse;
  [key: string]: unknown;
};
export type Har = {
  log: { entries: HarEntry[]; [key: string]: unknown };
  [key: string]: unknown;
};
export type ScanOptions = {
  sanitize?: boolean;
  requireHars?: boolean;
};
export type ScanResult = {
  harFiles: number;
  fixtureFiles: number;
  issues: SecurityIssue[];
  changedFiles: string[];
};
export function sanitizeHar(value: unknown): Har;
export function sanitizeUrl(value: string): string;
export function inspectHar(value: unknown): SecurityIssue[];
export function assertSafeHar(value: unknown, label?: string): asserts value is Har;
export function inspectFixture(value: unknown): SecurityIssue[];
export function sanitizeFixture(value: unknown): unknown;
export function sanitizeDiagnostic(value: unknown): string;
export function sanitizePostData(value: HarPostData, url?: string): Pick<HarPostData, "mimeType" | "text">;
export function runtimeArtifact(path: string): boolean;
export function assertSafeFixture(value: unknown, label?: string): void;
export function scanFixtures(paths: string[], options?: ScanOptions): Promise<ScanResult>;
/** Internal CLI support; returns only git-tracked storage-state file roots. */
export function trackedAuthRoots(paths: string[], cwd?: string): Promise<string[]>;
export function inspectTrackedAuth(paths: string[], cwd?: string): Promise<SecurityIssue[]>;
export function scanStagedFixtures(paths: string[], options?: Pick<ScanOptions, "requireHars">): Promise<ScanResult>;

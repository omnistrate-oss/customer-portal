import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { lstat, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

const REDACTED = "REDACTED_PLAYWRIGHT_HAR";
const MAX_BYTES = 100 * 1024 * 1024;
const MAX_DEPTH = 80;
const sensitiveKeys = new Set([
  "authorization",
  "proxyauthorization",
  "cookie",
  "setcookie",
  "password",
  "passwd",
  "pwd",
  "secret",
  "secrets",
  "clientsecret",
  "secretkey",
  "apikey",
  "apitoken",
  "accesskey",
  "accesskeyid",
  "awsaccesskeyid",
  "awssecretaccesskey",
  "awssecuritytoken",
  "accesstoken",
  "refreshtoken",
  "idtoken",
  "authtoken",
  "bearertoken",
  "sessiontoken",
  "sessionid",
  "token",
  "tokens",
  "credential",
  "credentials",
  "privatekey",
  "signingkey",
  "signingsecret",
  "jwt",
  "jwttoken",
  "jwtsecret",
  "authentication",
]);
const credentialHeaders = new Set([
  "authorization",
  "proxy-authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "api-key",
  "x-auth-token",
]);
const safePathKeys = new Set([
  "log",
  "entries",
  "request",
  "response",
  "headers",
  "cookies",
  "queryString",
  "postData",
  "params",
  "content",
  "text",
  "value",
  "url",
  "redirectURL",
  "origins",
  "localStorage",
  "sessionStorage",
]);
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  ".next",
  ".nuxt",
  "coverage",
  "dist",
  "build",
  "playwright-report",
  "test-results",
]);
const normalizeKey = (key) => key.toLowerCase().replace(/[^a-z0-9]/g, "");
const credentialMetadataKeys = new Set([
  "id",
  "name",
  "label",
  "type",
  "description",
  "format",
  "enabled",
  "required",
  "readOnly",
  "createdAt",
  "updatedAt",
  "expiresAt",
  "tokenId",
  "secretId",
  "keyId",
  "version",
]);
const sensitive = (key) =>
  sensitiveKeys.has(normalizeKey(key)) ||
  /(?:password|passwd|clientsecret|secretkey|signingsecret|apikey|apitoken|accesstoken|refreshtoken|authtoken|jwttoken|privatekey)$/.test(
    normalizeKey(key)
  );
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const safeValue = (value) =>
  value == null ||
  value === "" ||
  (typeof value === "string" && /^(?:om_)?(?:REDACTED_PLAYWRIGHT_HAR|\[REDACTED\])$/.test(value));
const fieldPath = (path, key, index) => (safePathKeys.has(key) ? `${path}.${key}` : `${path}[field:${index}]`);
// Labels may contain opaque credentials: hashing avoids returning attacker-controlled names.
const fileLabel = (path) => `file[${createHash("sha256").update(String(path)).digest("hex").slice(0, 16)}]`;
class SafeFailure extends Error {
  constructor(path, reason) {
    super(`${path}: ${reason}`);
    this.name = "HarSecurityError";
    this.issue = { path, reason };
  }
}
const fail = (path, reason) => {
  throw new SafeFailure(path, reason);
};
const add = (issues, path, reason) => {
  issues.push({ path, reason });
};

function cloneJson(value, path = "$", depth = 0, seen = new Set()) {
  if (depth > MAX_DEPTH) fail(path, "JSON nesting limit exceeded");
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "object" || seen.has(value)) fail(path, "invalid JSON value");
  if (
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) !== Object.prototype &&
    Object.getPrototypeOf(value) !== null
  )
    fail(path, "invalid JSON object");
  seen.add(value);
  let output;
  if (Array.isArray(value))
    output = Array.from(value, (item, index) => cloneJson(item, `${path}[${index}]`, depth + 1, seen));
  else {
    output = {};
    Object.keys(value).forEach((key, index) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !("value" in descriptor)) fail(fieldPath(path, key, index), "invalid JSON property");
      Object.defineProperty(output, key, {
        value: cloneJson(descriptor.value, fieldPath(path, key, index), depth + 1, seen),
        enumerable: true,
        writable: true,
        configurable: true,
      });
    });
  }
  seen.delete(value);
  return output;
}

function validateHar(value) {
  if (!object(value) || !object(value.log) || !Array.isArray(value.log.entries))
    fail("$.log.entries", "invalid HAR structure");
  value.log.entries.forEach((entry, index) => {
    const path = `$.log.entries[${index}]`;
    if (!object(entry) || !object(entry.request) || !object(entry.response)) fail(path, "invalid HAR entry");
    if (typeof entry.request.method !== "string" || !entry.request.method || typeof entry.request.url !== "string")
      fail(`${path}.request`, "invalid HAR request");
    if (
      typeof entry.response.status !== "number" ||
      !Number.isInteger(entry.response.status) ||
      entry.response.status < 0 ||
      entry.response.status > 599 ||
      !object(entry.response.content)
    )
      fail(`${path}.response`, "invalid HAR response");
    for (const side of ["request", "response"]) {
      const part = entry[side];
      if (
        !Array.isArray(part.headers) ||
        part.headers.some((h) => !object(h) || typeof h.name !== "string" || typeof h.value !== "string")
      )
        fail(`${path}.${side}.headers`, "invalid HAR headers");
      if (part.cookies !== undefined && !Array.isArray(part.cookies))
        fail(`${path}.${side}.cookies`, "invalid HAR cookies");
    }
    if (entry.response.bodySize !== undefined && typeof entry.response.bodySize !== "number")
      fail(`${path}.response`, "invalid HAR response body size");
    if (
      entry.request.queryString !== undefined &&
      (!Array.isArray(entry.request.queryString) ||
        entry.request.queryString.some((p) => !object(p) || typeof p.name !== "string" || typeof p.value !== "string"))
    )
      fail(`${path}.request.queryString`, "invalid HAR query parameters");
    if (entry.request.postData !== undefined) {
      const post = entry.request.postData;
      if (
        !object(post) ||
        (post.params !== undefined &&
          (!Array.isArray(post.params) ||
            post.params.some(
              (p) => !object(p) || typeof p.name !== "string" || (p.value !== undefined && typeof p.value !== "string")
            )))
      )
        fail(`${path}.request.postData`, "invalid HAR post data");
    }
  });
}
function parseJson(text, path) {
  try {
    return JSON.parse(text);
  } catch {
    fail(path, "invalid JSON body");
  }
}
function decodeQuery(value, path) {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    fail(path, "invalid URL encoding");
  }
}

function literalScrub(text, path, issues) {
  let result = text.replace(/(?<![A-Za-z0-9_-])[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]*/g, (literal) => {
    try {
      const header = JSON.parse(Buffer.from(literal.split(".")[0], "base64url").toString("utf8"));
      if (!object(header) || typeof header.alg !== "string") return literal;
    } catch {
      return literal;
    }
    add(issues, path, "JWT literal");
    return REDACTED;
  });
  result = result.replace(/\bom_[A-Za-z0-9_-]{8,}\b/g, (literal) => {
    if (safeValue(literal)) return literal;
    add(issues, path, "API key literal");
    return `om_${REDACTED}`;
  });
  result = result.replace(/\bBasic[ \t]+([A-Za-z0-9+/]+={0,2})(?![A-Za-z0-9_+/=-])/gi, (whole, credential) => {
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(credential)) return whole;
    try {
      const bytes = Buffer.from(credential, "base64");
      if (bytes.toString("base64") !== credential) return whole;
      const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (!/^[^\x00-\x1f\x7f:]+:[^\x00-\x1f\x7f]*$/.test(decoded)) return whole;
    } catch {
      return whole;
    }
    add(issues, path, "Basic credential literal");
    return `Basic ${REDACTED}`;
  });
  return result;
}
function encodedLiteralScrub(text, path, issues, depth = 0) {
  if (depth > MAX_DEPTH) fail(path, "encoded nesting limit exceeded");
  if (!text.includes("%")) return literalScrub(text, path, issues);
  let decoded;
  try {
    decoded = decodeURIComponent(text);
  } catch {
    fail(path, "invalid URL encoding");
  }
  const clean =
    decoded === text ? literalScrub(text, path, issues) : encodedLiteralScrub(decoded, path, issues, depth + 1);
  return clean === decoded ? text : encodeURIComponent(clean);
}
function scrubPairs(text, path, issues, depth) {
  return text
    .split("&")
    .map((pair, index) => {
      const equal = pair.indexOf("=");
      const rawName = equal === -1 ? pair : pair.slice(0, equal);
      const rawValue = equal === -1 ? "" : pair.slice(equal + 1);
      const name = decodeQuery(rawName, `${path}[${index}]`);
      const value = decodeQuery(rawValue, `${path}[${index}]`);
      const cleanName = literalScrub(name, `${path}[${index}]`, issues);
      let clean;
      if (sensitive(name) && !safeValue(value)) {
        add(issues, `${path}[${index}]`, "sensitive query parameter");
        clean = REDACTED;
      } else clean = scrubText(value, `${path}[${index}]`, issues, depth + 1, true);
      return (
        (name === cleanName ? rawName : encodeURIComponent(cleanName)) +
        (equal === -1 && clean === "" ? "" : "=" + (clean === value ? rawValue : encodeURIComponent(clean)))
      );
    })
    .join("&");
}
function scrubUrl(text, path, issues, depth) {
  let value = text;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    try {
      if (!new URL(value).hostname) fail(path, "invalid HAR URL");
    } catch {
      fail(path, "invalid HAR URL");
    }
    value = value.replace(/^([a-z][a-z0-9+.-]*:\/\/)([^/?#]*@)/i, (all, scheme, userInfo) => {
      if (userInfo === `${REDACTED}@`) return all;
      add(issues, path, "URL credentials");
      return `${scheme}${REDACTED}@`;
    });
  }
  const hash = value.indexOf("#");
  const main = hash === -1 ? value : value.slice(0, hash);
  const fragment = hash === -1 ? "" : value.slice(hash + 1);
  const query = main.indexOf("?");
  try {
    decodeURIComponent(query === -1 ? main : main.slice(0, query));
  } catch {
    fail(path, "invalid URL encoding");
  }
  const rawPath = query === -1 ? main : main.slice(0, query);
  const cleanPath = rawPath
    .split("/")
    .map((segment) => encodedLiteralScrub(segment, path, issues))
    .join("/");
  let result =
    query === -1
      ? cleanPath
      : cleanPath + "?" + scrubPairs(main.slice(query + 1), `${path}.queryString`, issues, depth + 1);
  if (hash !== -1)
    result +=
      "#" +
      (fragment.includes("=")
        ? scrubPairs(fragment, `${path}.queryString`, issues, depth + 1)
        : scrubText(fragment, path, issues, depth + 1));
  return literalScrub(result, path, issues);
}
function scrubText(text, path, issues, depth = 0, strictEncoding = false) {
  if (depth > MAX_DEPTH) fail(path, "encoded nesting limit exceeded");
  if (/^\s*[\[{]/.test(text)) {
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      return literalScrub(text, path, issues);
    }
    const clean = walk(value, path, issues, depth + 1);
    return JSON.stringify(value) === JSON.stringify(clean) ? text : JSON.stringify(clean);
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(text) || /^[/?.][^\s]*\?/.test(text))
    return scrubUrl(text, path, issues, depth + 1);
  if (text.includes("%")) {
    if (/\s/.test(text)) {
      const encodedSpans = text.replace(/(?:[A-Za-z0-9_.~-]|%[0-9a-f]{2})+/gi, (span) =>
        span.includes("%") ? scrubText(span, path, issues, depth + 1, strictEncoding) : span
      );
      if (encodedSpans !== text) return scrubText(encodedSpans, path, issues, depth + 1, strictEncoding);
    }
    let decoded;
    try {
      decoded = decodeURIComponent(text);
    } catch {
      if (strictEncoding) fail(path, "invalid URL encoding");
      return literalScrub(text, path, issues);
    }
    if (decoded !== text) {
      const clean = scrubText(decoded, path, issues, depth + 1, strictEncoding);
      if (clean !== decoded) return encodeURIComponent(clean);
    }
  }
  if (/^[^\s=&]+=[^\r\n]*$/.test(text)) return scrubPairs(text, path, issues, depth + 1);
  const withUrls = text.replace(/https?:\/\/[^\s"'<>]+/gi, (url) => {
    const punctuation = url.match(/[),.;!?]+$/)?.[0] || "";
    return scrubUrl(punctuation ? url.slice(0, -punctuation.length) : url, path, issues, depth + 1) + punctuation;
  });
  return literalScrub(withUrls, path, issues);
}
function redactLeaves(value, path, issues, depth, context = "") {
  if (Array.isArray(value))
    return value.map((item, index) => redactLeaves(item, `${path}[${index}]`, issues, depth + 1, context));
  if (object(value)) return walk(value, path, issues, depth + 1, context);
  // JSON capability flags, schema secret flags, counts and IDs are not credential material.
  if (
    safeValue(value) ||
    typeof value === "boolean" ||
    (typeof value === "number" &&
      context !== "credentialValue" &&
      ["token", "tokens", "secret", "credential", "credentials", "apikey", "authentication"].includes(
        normalizeKey(context)
      )) ||
    (normalizeKey(context) === "authentication" &&
      typeof value === "string" &&
      /^(?:Bearer|Basic|Digest|OAuth2?|none)$/i.test(value))
  )
    return value;
  add(issues, path, "sensitive credential field");
  return REDACTED;
}
function walk(value, path, issues, depth = 0, context = "") {
  if (depth > MAX_DEPTH) fail(path, "JSON nesting limit exceeded");
  if (typeof value === "string") return scrubText(value, path, issues, depth + 1);
  if (Array.isArray(value)) {
    if (context === "cookies") {
      if (
        value.some((cookie) => object(cookie) && typeof cookie.name === "string" && typeof cookie.value === "string")
      ) {
        add(issues, path, "cookie state");
        return [];
      }
    }
    if (context === "headers")
      return value
        .filter((header, index) => {
          if (
            object(header) &&
            typeof header.name === "string" &&
            typeof header.value === "string" &&
            credentialHeaders.has(header.name.toLowerCase().trim())
          ) {
            add(issues, `${path}[${index}]`, "credential header");
            return false;
          }
          return true;
        })
        .map((item, index) => walk(item, `${path}[${index}]`, issues, depth + 1));
    return value.map((item, index) => walk(item, `${path}[${index}]`, issues, depth + 1, context));
  }
  if (!object(value)) return value;
  const result = {};
  Object.keys(value).forEach((key, index) => {
    const itemPath = fieldPath(path, key, index);
    const cleanKey = literalScrub(key, itemPath, issues);
    let clean;
    const namedCredential =
      (key === "value" &&
        typeof value.name === "string" &&
        ["params", "queryString", "localStorage", "sessionStorage"].includes(context) &&
        sensitive(value.name)) ||
      (["value", "key", "raw", "secretValue", "tokenValue", "passwordValue", "plaintext", "material"].includes(key) &&
        (sensitive(context) || context === "secretPayload"));
    const nestedMaterial = context === "credentialValue" && !credentialMetadataKeys.has(key);
    if (sensitive(key) || namedCredential || nestedMaterial)
      clean = redactLeaves(
        value[key],
        itemPath,
        issues,
        depth + 1,
        namedCredential || nestedMaterial ? "credentialValue" : key
      );
    else
      clean = walk(
        value[key],
        itemPath,
        issues,
        depth + 1,
        (sensitive(context) || context === "secretPayload" || context === "credentialValue") &&
          (object(value[key]) || Array.isArray(value[key]))
          ? context
          : key
      );
    if (Object.hasOwn(result, cleanKey)) fail(itemPath, "sanitized property collision");
    Object.defineProperty(result, cleanKey, {
      value: clean,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  });
  return result;
}
function bodyText(container, path, issues, apiKeyResponse = false, secretPayload = false) {
  if (container.encoding !== undefined && container.encoding !== "base64") fail(path, "unsupported HAR encoding");
  if (container.text === undefined) return;
  if (
    typeof container.text !== "string" ||
    (container.mimeType !== undefined && typeof container.mimeType !== "string")
  )
    fail(path, "invalid HAR body");
  if (container.text === "") return;
  const mime = (container.mimeType || "").split(";")[0].trim().toLowerCase();
  const jsonMime = mime === "application/json" || mime === "text/json" || mime.endsWith("+json");
  const binary =
    /^(?:image|audio|video|font)\//.test(mime) ||
    ["application/octet-stream", "application/pdf", "application/zip"].includes(mime);
  let text = container.text;
  let recognizedJson = false;
  if (container.encoding === "base64") {
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text))
      fail(path, "invalid base64 body");
    const bytes = Buffer.from(text, "base64");
    if (bytes.toString("base64") !== text) fail(path, "invalid base64 body");
    if (binary) {
      const decoded = bytes.toString("latin1");
      const clean = literalScrub(decoded, path, issues);
      let utf8;
      try {
        utf8 = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        /* Valid binary payload. */
      }
      if (utf8 && /^\s*[\[{]/.test(utf8)) {
        try {
          JSON.parse(utf8);
          recognizedJson = true;
          text = utf8;
        } catch {
          fail(path, "invalid JSON body");
        }
      }
      if (!recognizedJson) {
        if (utf8 && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(utf8) && scrubText(utf8, path, issues) !== utf8)
          fail(path, "credential text in binary body");
        if (decoded !== clean) fail(path, "credential literal in binary body");
        return;
      }
    }
    if (!recognizedJson)
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      } catch {
        fail(path, "invalid UTF-8 body");
      }
  }
  let clean;
  if (jsonMime || recognizedJson) {
    const value = parseJson(text, path);
    let keyChanged = false;
    if (apiKeyResponse && object(value) && typeof value.key === "string" && !safeValue(value.key)) {
      add(issues, path, "API key response");
      value.key = `om_${REDACTED}`;
      keyChanged = true;
    }
    const output = walk(value, path, issues, 0, secretPayload ? "secretPayload" : "");
    clean = JSON.stringify(value) === JSON.stringify(output) && !keyChanged ? text : JSON.stringify(output);
  } else if (mime === "application/x-www-form-urlencoded") clean = scrubPairs(text, path, issues, 0);
  else clean = scrubText(text, path, issues);
  if (clean !== text) container.text = container.encoding === "base64" ? Buffer.from(clean).toString("base64") : clean;
}
function transformHar(value, issues) {
  const clone = cloneJson(value);
  validateHar(clone);
  clone.log.entries.forEach((entry, index) => {
    const path = `$.log.entries[${index}]`;
    if (!/^https?:\/\//i.test(entry.request.url)) fail(`${path}.request.url`, "invalid HAR URL");
    scrubUrl(entry.request.url, `${path}.request.url`, [], 0);
    const isSecretEndpoint = /\/secrets?(?:[/?#]|$)/i.test(entry.request.url);
    if (entry.request.postData)
      bodyText(entry.request.postData, `${path}.request.postData.text`, issues, false, isSecretEndpoint);
    bodyText(
      entry.response.content,
      `${path}.response.content.text`,
      issues,
      /(?:api[-_]?keys?|\/token)(?:[/?#]|$)/i.test(entry.request.url),
      isSecretEndpoint
    );
    entry.request.cookies ??= [];
    entry.response.cookies ??= [];
    for (const side of ["request", "response"]) {
      if (entry[side].cookies.length) add(issues, `${path}.${side}.cookies`, "cookie state");
      entry[side].cookies = [];
    }
  });
  return walk(clone, "$", issues);
}
/** Clone and sanitize a valid HAR. All errors exclude supplied backend content. */
export function sanitizeHar(value) {
  try {
    return transformHar(value, []);
  } catch (error) {
    if (error instanceof SafeFailure) throw error;
    fail("$", "HAR sanitation failed");
  }
}
/** Canonicalize replay URLs through the same query redaction as recorded HARs. */
export function sanitizeUrl(value) {
  try {
    if (typeof value !== "string") fail("$.url", "invalid URL value");
    return scrubUrl(value, "$.url", [], 0);
  } catch (error) {
    if (error instanceof SafeFailure) throw error;
    fail("$.url", "URL sanitation failed");
  }
}
export function inspectHar(value) {
  const issues = [];
  try {
    transformHar(value, issues);
  } catch (error) {
    issues.push(error instanceof SafeFailure ? error.issue : { path: "$", reason: "HAR inspection failed" });
  }
  return issues;
}
export function assertSafeHar(value, label = "HAR") {
  const issues = inspectHar(value);
  if (issues.length)
    throw new SafeFailure(
      `${typeof label !== "string" || label === "HAR" ? "HAR" : fileLabel(label)}${issues[0].path}`,
      issues[0].reason
    );
}
export function inspectFixture(value) {
  const issues = [];
  try {
    walk(cloneJson(value), "$", issues);
  } catch (error) {
    issues.push(error instanceof SafeFailure ? error.issue : { path: "$", reason: "fixture inspection failed" });
  }
  return issues;
}
/** Clone ordinary JSON fixtures for credential-safe disk persistence. */
export function sanitizeFixture(value) {
  try {
    return walk(cloneJson(value), "$", []);
  } catch (error) {
    if (error instanceof SafeFailure) throw error;
    fail("$", "fixture sanitation failed");
  }
}
export function assertSafeFixture(value, label = "fixture") {
  const issues = inspectFixture(value);
  if (issues.length)
    throw new SafeFailure(
      `${typeof label !== "string" || label === "fixture" ? "fixture" : fileLabel(label)}${issues[0].path}`,
      issues[0].reason
    );
}
function gitRepo(path) {
  try {
    return execFileSync("git", ["-C", path, "rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}
function trackedJson(root) {
  try {
    return execFileSync("git", ["-C", root, "ls-files", "-z"], {
      encoding: "utf8",
      maxBuffer: MAX_BYTES,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\0")
      .filter((path) => /\.json(?:\.gz)?$/i.test(path))
      .map((path) => resolve(root, path));
  } catch {
    fail(fileLabel(root), "cannot inspect git tracked files");
  }
}
const authState = (value) => object(value) && Array.isArray(value.cookies) && Array.isArray(value.origins);
const fixtureSuffix = /\.(?:har|json)(?:\.gz)?$/i;
async function readJsonFile(path) {
  const info = await lstat(path);
  if (info.size > MAX_BYTES) fail(fileLabel(path), "fixture size limit exceeded");
  const data = await readFile(path);
  const bytes = /\.gz$/i.test(path) ? gunzipSync(data, { maxOutputLength: MAX_BYTES }) : data;
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return { value: JSON.parse(text), mode: info.mode };
}
/** Scan all HAR/JSON fixtures. Validate the complete sanitation plan before replacing files. */
export async function scanFixtures(paths, options = {}) {
  const result = { harFiles: 0, fixtureFiles: 0, issues: [], changedFiles: [] };
  const files = new Set();
  const roots = Array.isArray(paths) ? paths : [];
  if (!Array.isArray(paths)) result.issues.push({ path: "$", reason: "invalid fixture roots" });
  const tracked = new Set();
  const repos = new Set();
  for (const root of roots) {
    if (typeof root !== "string" || !root) {
      result.issues.push({ path: "$", reason: "invalid fixture root" });
      continue;
    }
    try {
      const info = await lstat(resolve(root));
      const repo = gitRepo(info.isDirectory() ? resolve(root) : dirname(resolve(root)));
      if (repo) repos.add(repo);
    } catch {
      result.issues.push({
        path: fileLabel(root),
        reason: "fixture root is missing or unreadable",
      });
    }
  }
  for (const repo of repos)
    try {
      for (const path of trackedJson(repo)) tracked.add(path);
    } catch (error) {
      result.issues.push(error.issue);
    }
  async function visit(path, explicit = false) {
    let info;
    try {
      info = await lstat(path);
    } catch {
      result.issues.push({
        path: fileLabel(path),
        reason: "fixture path is unreadable",
      });
      return;
    }
    if (info.isSymbolicLink()) {
      result.issues.push({
        path: fileLabel(path),
        reason: "symbolic fixture paths are unsupported",
      });
      return;
    }
    if (info.isDirectory()) {
      let names;
      try {
        names = await readdir(path);
      } catch {
        result.issues.push({
          path: fileLabel(path),
          reason: "fixture directory is unreadable",
        });
        return;
      }
      for (const name of names.sort()) if (!ignoredDirectories.has(name)) await visit(join(path, name));
    } else if (info.isFile() && fixtureSuffix.test(path)) files.add(path);
    else if (explicit)
      result.issues.push({
        path: fileLabel(path),
        reason: "unsupported fixture root",
      });
  }
  for (const root of roots) if (typeof root === "string" && root) await visit(resolve(root), true);
  const writes = [];
  let harEntries = 0;
  for (const path of [...files].sort()) {
    const label = fileLabel(path);
    const isHar = /\.har(?:\.gz)?$/i.test(path);
    if (isHar) result.harFiles++;
    let countedFixture = false;
    try {
      const { value, mode } = await readJsonFile(path);
      const isAuth = !isHar && authState(value);
      if (isHar && object(value) && object(value.log) && Array.isArray(value.log.entries))
        harEntries += value.log.entries.length;
      if (isAuth && !tracked.has(path)) continue;
      if (!isHar) {
        result.fixtureFiles++;
        countedFixture = true;
      }
      if (options.sanitize && !isAuth) {
        const clean = isHar ? sanitizeHar(value) : sanitizeFixture(value);
        const residual = isHar ? inspectHar(clean) : inspectFixture(clean);
        if (residual.length) {
          result.issues.push(
            ...residual.map((issue) => ({
              path: label + issue.path,
              reason: issue.reason,
            }))
          );
          continue;
        }
        if (JSON.stringify(value) !== JSON.stringify(clean))
          writes.push({
            path,
            label,
            text: JSON.stringify(clean, null, 2) + "\n",
            mode,
          });
      } else
        result.issues.push(
          ...(isHar ? inspectHar(value) : inspectFixture(value)).map((issue) => ({
            path: label + issue.path,
            reason: issue.reason,
          }))
        );
    } catch (error) {
      if (!isHar && !countedFixture) result.fixtureFiles++;
      result.issues.push({
        path: error instanceof SafeFailure ? label + error.issue.path : label,
        reason: error instanceof SafeFailure ? error.issue.reason : "fixture read, decompression or JSON parse failed",
      });
    }
  }
  if (options.requireHars && (result.harFiles === 0 || harEntries === 0))
    result.issues.push({ path: "$", reason: "required HAR corpus is empty" });
  if (!result.issues.length)
    for (const planned of writes) {
      const temporary = `${planned.path}.sanitized-${randomUUID()}.tmp`;
      try {
        await writeFile(temporary, /\.gz$/i.test(planned.path) ? gzipSync(planned.text) : planned.text, {
          flag: "wx",
          mode: planned.mode,
        });
        await rename(temporary, planned.path);
        result.changedFiles.push(planned.label);
      } catch {
        try {
          await unlink(temporary);
        } catch {
          /* Safe cleanup only. */
        }
        result.issues.push({
          path: planned.label,
          reason: "sanitized fixture write failed",
        });
        break;
      }
    }
  return result;
}
/** CLI support: add git-tracked storage-state paths, including those outside corpus roots. */
export async function trackedAuthRoots(paths, cwd = process.cwd()) {
  const repos = new Set();
  const rootRepo = gitRepo(cwd);
  if (rootRepo) repos.add(rootRepo);
  for (const path of paths)
    try {
      const info = await lstat(resolve(path));
      const repo = gitRepo(info.isDirectory() ? resolve(path) : dirname(resolve(path)));
      if (repo) repos.add(repo);
    } catch {
      /* The scanner reports missing roots. */
    }
  const output = [];
  for (const repo of repos)
    for (const path of trackedJson(repo)) {
      try {
        const info = await lstat(path);
        if (info.isSymbolicLink()) fail(fileLabel(path), "tracked JSON symlink is unsupported");
        const { value } = await readJsonFile(path);
        if (authState(value)) output.push(path);
      } catch (error) {
        if (error instanceof SafeFailure) throw error;
        if (/(?:^|[\\/])\.?auth(?:[\\/]|\.)|storage[-_]?state/i.test(path))
          fail(fileLabel(path), "tracked auth state is unreadable");
      }
    }
  return output;
}
/** Inspect actual index bytes so clean worktree files cannot hide staged auth credentials. */
export async function inspectTrackedAuth(paths, cwd = process.cwd()) {
  const repos = new Set();
  const rootRepo = gitRepo(cwd);
  if (rootRepo) repos.add(rootRepo);
  for (const path of paths)
    try {
      const info = await lstat(resolve(path));
      const repo = gitRepo(info.isDirectory() ? resolve(path) : dirname(resolve(path)));
      if (repo) repos.add(repo);
    } catch {
      /* Scanner diagnoses missing roots. */
    }
  const issues = [];
  for (const repo of repos)
    for (const path of trackedJson(repo)) {
      const label = fileLabel(path);
      try {
        const blob = execFileSync("git", ["-C", repo, "show", `:${relative(repo, path)}`], {
          maxBuffer: MAX_BYTES,
          stdio: ["ignore", "pipe", "ignore"],
        });
        const bytes = /\.gz$/i.test(path) ? gunzipSync(blob, { maxOutputLength: MAX_BYTES }) : blob;
        const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
        if (authState(value))
          issues.push(
            ...inspectFixture(value).map((issue) => ({ path: `${label}.index${issue.path}`, reason: issue.reason }))
          );
      } catch {
        if (/(?:^|[\\/])\.?auth(?:[\\/]|\.)|storage[-_]?state/i.test(path))
          issues.push({ path: `${label}.index`, reason: "tracked auth index bytes are unreadable" });
      }
    }
  return issues;
}
/** Read every indexed fixture in the selected corpus, including retained unmodified snapshots. */
export async function scanStagedFixtures(paths, options = {}) {
  const result = { harFiles: 0, fixtureFiles: 0, issues: [], changedFiles: [] };
  const roots = Array.isArray(paths)
    ? paths.filter((path) => typeof path === "string" && path).map((path) => resolve(path))
    : [];
  if (!Array.isArray(paths) || roots.length !== paths.length)
    result.issues.push({ path: "$", reason: "invalid fixture roots" });
  const repos = new Set();
  const currentRepo = gitRepo(process.cwd());
  if (currentRepo) repos.add(currentRepo);
  for (const root of roots) {
    const repo = gitRepo(root) || gitRepo(dirname(root));
    if (repo) repos.add(repo);
  }
  const within = (path, root) => path === root || path.startsWith(root + sep);
  for (const root of roots)
    if (![...repos].some((repo) => within(root, repo)))
      result.issues.push({ path: fileLabel(root), reason: "staged fixture root is outside a git repository" });
  let harEntries = 0;
  for (const repo of repos) {
    let rows;
    try {
      rows = execFileSync("git", ["-C", repo, "ls-files", "--stage", "-z"], {
        encoding: "utf8",
        maxBuffer: MAX_BYTES,
        stdio: ["ignore", "pipe", "ignore"],
      })
        .split("\0")
        .filter(Boolean);
    } catch {
      result.issues.push({ path: fileLabel(repo), reason: "cannot inspect git index" });
      continue;
    }
    for (const row of rows) {
      const tab = row.indexOf("\t");
      const fields = row.slice(0, tab).split(" ");
      const name = row.slice(tab + 1);
      const path = resolve(repo, name);
      if (
        !roots.some((root) => within(path, root)) ||
        relative(repo, path)
          .split(sep)
          .some((part) => ignoredDirectories.has(part))
      )
        continue;
      const label = `${fileLabel(path)}.index`;
      if (fields[0] === "120000") {
        result.issues.push({ path: label, reason: "symbolic fixture paths are unsupported" });
        continue;
      }
      if (!fixtureSuffix.test(path)) continue;
      const isHar = /\.har(?:\.gz)?$/i.test(path);
      if (isHar) result.harFiles++;
      else result.fixtureFiles++;
      if (fields[2] !== "0") {
        result.issues.push({ path: label, reason: "unmerged staged fixture" });
        continue;
      }
      try {
        const blob = execFileSync("git", ["-C", repo, "show", `:${name}`], {
          maxBuffer: MAX_BYTES,
          stdio: ["ignore", "pipe", "ignore"],
        });
        const bytes = /\.gz$/i.test(path) ? gunzipSync(blob, { maxOutputLength: MAX_BYTES }) : blob;
        const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
        if (isHar && object(value) && object(value.log) && Array.isArray(value.log.entries))
          harEntries += value.log.entries.length;
        result.issues.push(
          ...(isHar ? inspectHar(value) : inspectFixture(value)).map((issue) => ({
            path: label + issue.path,
            reason: issue.reason,
          }))
        );
      } catch {
        result.issues.push({ path: label, reason: "staged fixture read, decompression or JSON parse failed" });
      }
    }
  }
  if (options.requireHars && (result.harFiles === 0 || harEntries === 0))
    result.issues.push({ path: "$", reason: "required HAR corpus is empty" });
  return result;
}

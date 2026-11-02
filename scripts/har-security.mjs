import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { realpathSync } from "node:fs";
import { lstat, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

const REDACTED = "REDACTED_PLAYWRIGHT_HAR";
const REDACTED_NUMBER = Number.MIN_SAFE_INTEGER;
const MAX_BYTES = 100 * 1024 * 1024;
const MAX_DEPTH = 80;
const sensitiveKeys = new Set([
  "authorization",
  "proxyauthorization",
  "cookie",
  "setcookie",
  "password",
  "pass",
  "passphrase",
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
  "auth",
  "kubeconfig",
  "secretvalue",
  "secretaccesskey",
  "handofftoken",
  "clientkeydata",
  "clientkeydatabase64",
  "clientcertificatedata",
  "clientcertificatedatabase64",
  "serviceaccounttoken",
  "tokenvalue",
  "providertoken",
  "usertoken",
  "currentpassword",
  "currentpasswordhash",
  "hashedpassword",
  "privatekeypem",
  "certificatebase64",
  "omnistratesecret",
  "rehearsalhandofftoken",
  "awsaccesskey",
  "awssecretkey",
  "xamzsignature",
  "xamzcredential",
  "xamzsecuritytoken",
  "xgoogsignature",
  "xgoogcredential",
]);
const credentialHeaders = new Set([
  "authorization",
  "proxy-authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "api-key",
  "x-auth-token",
  "x-access-token",
  "x-session-token",
  "x-amz-security-token",
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
const normalizeKey = (key) => key.toLowerCase().replace(/[^a-z0-9]/g, "");
const credentialMetadataKeys = new Set(
  [
    "id",
    "name",
    "label",
    "type",
    "description",
    "format",
    "status",
    "createdAt",
    "updatedAt",
    "expiresAt",
    "tokenId",
    "secretId",
    "keyId",
    "version",
    "kind",
    "key",
    "path",
    "mountPath",
    "region",
    "provider",
    "cloudProvider",
    "database",
    "username",
    "host",
    "port",
    "state",
    "size",
    "$ref",
  ].map(normalizeKey)
);
const credentialMetadata = (key) =>
  credentialMetadataKeys.has(normalizeKey(key)) || /(?:id|name|type|at|date|count|path)$/.test(normalizeKey(key));
const credentialValueKeys = new Set([
  "value",
  "secretvalue",
  "data",
  "content",
  "contents",
  "filecontent",
  "pass",
  "pwd",
  "passwd",
  "passphrase",
]);
const credentialContainers = new Set([
  "credential",
  "credentials",
  "secret",
  "secrets",
  "token",
  "tokens",
  "auth",
  "authentication",
]);
const sensitive = (key) =>
  sensitiveKeys.has(normalizeKey(key)) ||
  /(?:password|passwordhash|hashedpassword|passwd|clientsecret|secretkey|signingsecret|apikey|apitoken|accesstoken|refreshtoken|authtoken|jwttoken|privatekey|handofftoken)$/.test(
    normalizeKey(key)
  );
const credentialContext = (context) =>
  sensitive(context) || ["credentialValue", "secretPayload", "secretDictionary"].includes(context);
const fileContext = (context) => credentialContext(context) || /configfile/i.test(normalizeKey(context));
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const secretDictionary = (value, context) =>
  object(value) &&
  !(context === "properties" && (typeof value.$ref === "string" || typeof value.type === "string")) &&
  !(typeof value.$ref === "string" && value.$ref.startsWith("#/")) &&
  !(
    typeof value.type === "string" &&
    /^(?:string|password|secret|boolean|number|integer|object|array)$/.test(value.type) &&
    (object(value.items) || object(value.properties) || Object.hasOwn(value, "additionalProperties"))
  );
// The numeric sentinel keeps credential fixtures type-compatible.
const safeValue = (value) =>
  value == null ||
  value === "" ||
  value === REDACTED_NUMBER ||
  (typeof value === "string" && /^(?:om_)?(?:REDACTED_PLAYWRIGHT_HAR|\[REDACTED\])$/.test(value));
const nonliteralAssignment = (value) => safeValue(value) || /^(?:\$[A-Za-z_{(]|\{\{|\/|\.\/|~\/)/.test(value.trim());
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

const cloneJson = (value, path = "$", depth = 0, seen = new Set()) => {
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
};

const validateHar = (value) => {
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
        ((side === "response" || part.headers !== undefined) && !Array.isArray(part.headers)) ||
        part.headers?.some((h) => !object(h) || typeof h.name !== "string" || typeof h.value !== "string")
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
};
const parseJson = (text, path) => {
  try {
    return JSON.parse(text);
  } catch {
    fail(path, "invalid JSON body");
  }
};
const decodeQuery = (value, path) => {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    fail(path, "invalid URL encoding");
  }
};

const literalScrub = (text, path, issues) => {
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
  result = result.replace(/\bBearer[ \t]+([A-Za-z0-9._~+/-]+=*)/gi, (whole, credential) => {
    if (safeValue(credential) || /^(?:tokens?|authentication|authorization|scheme)$/i.test(credential)) return whole;
    add(issues, path, "Bearer credential literal");
    return `Bearer ${REDACTED}`;
  });
  result = result.replace(/-----BEGIN ([A-Z0-9 ]*PRIVATE KEY)-----[\s\S]*?(?:-----END \1-----|$)/g, () => {
    add(issues, path, "PEM private key");
    return REDACTED;
  });
  result = result.replace(/\bhoff_[A-Za-z0-9_-]+\b/g, (literal) => {
    if (literal === `hoff_${REDACTED}`) return literal;
    add(issues, path, "handoff credential literal");
    return `hoff_${REDACTED}`;
  });
  const redactAssignment = (whole, prefix, field, name, credential) => {
    if (!sensitive(name) && !credentialHeaders.has(name.toLowerCase())) return whole;
    const quote = /^["']/.test(credential) ? credential[0] : "";
    const punctuation = quote ? "" : (credential.match(/[).!]+$/)?.[0] ?? "");
    const value = quote ? credential.slice(1, -1) : credential.slice(0, credential.length - punctuation.length);
    if (nonliteralAssignment(value)) return whole;
    add(issues, path, "credential text field");
    return `${prefix}${field}${quote}${REDACTED}${quote}${punctuation}`;
  };
  const assignments = /(?<![A-Za-z0-9_-])(["']?)([A-Za-z][A-Za-z0-9_-]*)\1[ \t]*[:=][ \t]*/g;
  let assignment;
  let scrubbed = "";
  let offset = 0;
  while ((assignment = assignments.exec(result)) !== null) {
    const [field, _quote, name] = assignment;
    if (!sensitive(name) && !credentialHeaders.has(name.toLowerCase())) continue;
    if (nonliteralAssignment(result.slice(assignments.lastIndex).replace(/^["']/, ""))) continue;
    const credential = result
      .slice(assignments.lastIndex)
      .match(
        /^(?:"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'|(?:Bearer|Basic)[ \t]+[^\s,;&{}\[\]"'#]+|[^\s,;&{}\[\]"'#]+)/i
      )?.[0];
    if (credential === undefined) continue;
    const whole = field + credential;
    const clean = redactAssignment(whole, "", field, name, credential);
    if (clean !== whole) {
      scrubbed += result.slice(offset, assignment.index) + clean;
      offset = assignments.lastIndex + credential.length;
      assignments.lastIndex = offset;
    }
  }
  result = scrubbed + result.slice(offset);
  result = result.replace(
    /^([ \t]*(?:-[ \t]+)?(?:name|key)[ \t]*:[ \t]*)(?:"([^"\r\n]+)"|'([^'\r\n]+)'|([A-Za-z][A-Za-z0-9_-]*))([ \t]*(?:#[^\r\n]*)?\r?\n[ \t]*value[ \t]*:[ \t]*)("(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'|\$\{[^}\r\n]*\}|[^\s,;{}\[\]"'#]+)/gm,
    (whole, field, doubleQuotedName, singleQuotedName, bareName, separator, credential) => {
      const name = doubleQuotedName ?? singleQuotedName ?? bareName;
      const quotedName = doubleQuotedName ? `"${name}"` : singleQuotedName ? `'${name}'` : name;
      return redactAssignment(whole, "", `${field}${quotedName}${separator}`, name, credential);
    }
  );
  return result;
};
const encodedLiteralScrub = (text, path, issues) => {
  const decoded = decodeQuery(text, path);
  const clean = literalScrub(decoded, path, issues);
  return clean === decoded ? text : encodeURIComponent(clean);
};
const scrubPairs = (text, path, issues, depth, callback = false, strictEncoding = true) => {
  const decode = (value, itemPath) => {
    try {
      return decodeQuery(value, itemPath);
    } catch (error) {
      if (strictEncoding) throw error;
      return value;
    }
  };
  const pairs = text.split("&").map((pair, index) => {
    const equal = pair.indexOf("=");
    const rawName = equal === -1 ? pair : pair.slice(0, equal);
    const rawValue = equal === -1 ? "" : pair.slice(equal + 1);
    return {
      equal,
      rawName,
      rawValue,
      name: decode(rawName, `${path}[${index}]`),
      value: decode(rawValue, `${path}[${index}]`),
    };
  });
  const azure = pairs.some(({ name }) => ["se", "sp", "sv"].includes(name.toLowerCase()));
  return pairs
    .map(({ equal, rawName, rawValue, name, value }, index) => {
      const itemPath = `${path}[${index}]`;
      const cleanName = literalScrub(name, itemPath, issues);
      let clean;
      if (
        (sensitive(name) || (azure && name.toLowerCase() === "sig") || (callback && name.toLowerCase() === "code")) &&
        !safeValue(value) &&
        (strictEncoding || !nonliteralAssignment(value))
      ) {
        add(issues, itemPath, "sensitive query parameter");
        clean = REDACTED;
      } else clean = scrubText(value, itemPath, issues, depth + 1);
      return (
        (name === cleanName ? rawName : encodeURIComponent(cleanName)) +
        (equal === -1 && clean === "" ? "" : "=" + (clean === value ? rawValue : encodeURIComponent(clean)))
      );
    })
    .join("&");
};
const scrubUrl = (text, path, issues, depth, lenient = false) => {
  if (depth > MAX_DEPTH) fail(path, "encoded nesting limit exceeded");
  let value = text;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    // URLs quoted inside bodies may be templated or malformed; scrub them as text instead of failing.
    let parsed = false;
    try {
      parsed = Boolean(new URL(value).hostname);
    } catch {
      parsed = false;
    }
    if (!parsed && !lenient) fail(path, "invalid HAR URL");
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
  const rawPath = query === -1 ? main : main.slice(0, query);
  const cleanPath = rawPath
    .split("/")
    .map((segment) => encodedLiteralScrub(segment, path, issues))
    .join("/");
  let decodedPath = rawPath;
  try {
    decodedPath = decodeQuery(rawPath, path);
  } catch (error) {
    if (!lenient) throw error;
  }
  const callback = /(?:callback|handoff|oauth|auth|signin|login|arrival|landing)/i.test(decodedPath);
  let result =
    query === -1
      ? cleanPath
      : cleanPath +
        "?" +
        scrubPairs(main.slice(query + 1), `${path}.queryString`, issues, depth + 1, callback, !lenient);
  if (hash !== -1)
    result +=
      "#" +
      (fragment.includes("=")
        ? scrubPairs(fragment, `${path}.queryString`, issues, depth + 1, callback, !lenient)
        : encodedLiteralScrub(fragment, path, issues));
  return literalScrub(result, path, issues);
};
function scrubText(text, path, issues, depth = 0) {
  if (depth > MAX_DEPTH) fail(path, "encoded nesting limit exceeded");
  if (/^\s*[\[{]/.test(text)) {
    try {
      const value = JSON.parse(text);
      const clean = walk(value, path, issues, depth + 1);
      return JSON.stringify(value) === JSON.stringify(clean) ? text : JSON.stringify(clean);
    } catch (error) {
      if (error instanceof SafeFailure) throw error;
    }
  }
  if (/^[a-z][a-z0-9+.-]*:\/\/[^\s]*$/i.test(text) || /^[/?.][^\s]*\?/.test(text))
    return scrubUrl(text, path, issues, depth + 1, true);
  if (/^https?%(?:25)*3a/i.test(text) || /^%(?:25)*(?:7b|5b)/i.test(text)) {
    const decoded = decodeQuery(text, path);
    const clean = scrubText(decoded, path, issues, depth + 1);
    return clean === decoded ? text : encodeURIComponent(clean);
  }
  if (/^[^\s=&]+=[^\s"']*$/.test(text)) return scrubPairs(text, path, issues, depth + 1, false, false);
  const withUrls = text.replace(/(?<![a-z0-9+.-])[a-z][a-z0-9+.-]*:\/\/[^\s"'<>]+/gi, (url) => {
    const punctuation = url.match(/[),.;!]+$/)?.[0] ?? "";
    return scrubUrl(punctuation ? url.slice(0, -punctuation.length) : url, path, issues, depth + 1, true) + punctuation;
  });
  const encoded = withUrls.replace(/(?:[A-Za-z0-9_.~-]|%[0-9a-f]{2})+/gi, (span) => {
    if (!span.includes("%")) return span;
    let decoded;
    try {
      decoded = decodeURIComponent(span);
    } catch {
      return span;
    }
    const clean = literalScrub(decoded, path, issues);
    return clean === decoded ? span : encodeURIComponent(clean);
  });
  return literalScrub(encoded, path, issues);
}
const redactLeaves = (value, path, issues, depth, context = "credentialValue") => {
  if (depth > MAX_DEPTH) fail(path, "JSON nesting limit exceeded");
  if (Array.isArray(value))
    return value.map((item, index) => redactLeaves(item, `${path}[${index}]`, issues, depth + 1, context));
  if (object(value)) return walk(value, path, issues, depth + 1, context);
  if (
    safeValue(value) ||
    typeof value === "boolean" ||
    (normalizeKey(context) === "authentication" &&
      typeof value === "string" &&
      /^(?:Bearer|Basic|Digest|OAuth2?|none)$/i.test(value))
  )
    return value;
  add(issues, path, "sensitive credential field");
  return typeof value === "number" ? REDACTED_NUMBER : REDACTED;
};
const decodeBase64Text = (text) => {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text)) return null;
  const bytes = Buffer.from(text, "base64");
  if (bytes.toString("base64") !== text) return null;
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(decoded) ? null : decoded;
  } catch {
    return null;
  }
};
function walk(value, path, issues, depth = 0, context = "") {
  if (depth > MAX_DEPTH) fail(path, "JSON nesting limit exceeded");
  if (typeof value === "string") return scrubText(value, path, issues, depth + 1);
  if (Array.isArray(value)) {
    if (
      context === "cookies" &&
      value.some((cookie) => object(cookie) && typeof cookie.name === "string" && typeof cookie.value === "string")
    ) {
      add(issues, path, "cookie state");
      return [];
    }
    return value
      .filter((item, index) => {
        if (
          context === "headers" &&
          object(item) &&
          typeof item.value === "string" &&
          typeof item.name === "string" &&
          credentialHeaders.has(item.name.toLowerCase().trim())
        ) {
          add(issues, `${path}[${index}]`, "credential header");
          return false;
        }
        return true;
      })
      .map((item, index) =>
        credentialContext(context) &&
        !["secrets", "secretPayload"].includes(context) &&
        typeof item !== "number" &&
        typeof item !== "boolean"
          ? redactLeaves(item, `${path}[${index}]`, issues, depth + 1)
          : walk(item, `${path}[${index}]`, issues, depth + 1, context)
      );
  }
  if (!object(value)) return value;
  const result = {};
  Object.keys(value).forEach((key, index) => {
    const itemPath = fieldPath(path, key, index);
    const cleanKey = context === "secretDictionary" ? key : literalScrub(key, itemPath, issues);
    const normalized = normalizeKey(key);
    const item = value[key];
    const namedCredential =
      key === "value" && [value.name, value.key].some((name) => typeof name === "string" && sensitive(name));
    const material =
      credentialContext(context) &&
      (context === "secretDictionary" ||
        (!credentialMetadata(key) &&
          (credentialValueKeys.has(normalized) || (context === "credentialValue" && typeof item !== "number"))));
    const encodedFile =
      typeof item === "string" &&
      (normalized === "filecontent" ||
        (key === "value" && typeof value.name === "string" && normalizeKey(value.name) === "filecontent") ||
        (["content", "data"].includes(normalized) &&
          (fileContext(context) || normalizeKey(context).includes("websocket"))));
    let clean;
    if (sensitive(key) || namedCredential || material)
      clean = redactLeaves(
        item,
        itemPath,
        issues,
        depth + 1,
        namedCredential ||
          (context !== "secretDictionary" &&
            (credentialValueKeys.has(normalized) || (sensitive(key) && !credentialContainers.has(normalized))))
          ? "credentialValue"
          : normalized === "secrets" && secretDictionary(item, context)
            ? "secretDictionary"
            : credentialContext(context)
              ? context
              : key
      );
    else if (encodedFile) {
      const decoded = decodeBase64Text(item);
      if (decoded === null && normalizeKey(context).includes("websocket") && /^[A-Za-z0-9+/]+={0,2}$/.test(item))
        add(issues, itemPath, "unsupported encoded websocket payload");
      const scrubbed = scrubText(decoded ?? item, itemPath, issues, depth + 1);
      clean = decoded === null ? scrubbed : scrubbed === decoded ? item : Buffer.from(scrubbed).toString("base64");
    } else
      clean = walk(
        item,
        itemPath,
        issues,
        depth + 1,
        normalized === "secrets" && secretDictionary(item, context)
          ? "secretDictionary"
          : (credentialContext(context) || fileContext(context)) && (object(item) || Array.isArray(item))
            ? context
            : key
      );
    if (Object.hasOwn(result, cleanKey)) fail(itemPath, "sanitized property collision");
    Object.defineProperty(result, cleanKey, { value: clean, enumerable: true, writable: true, configurable: true });
  });
  return result;
}
const scrubMultipart = (text, mimeType, path, issues, response) => {
  const boundary =
    mimeType
      .match(/boundary=(?:"([^"]+)"|([^;\s]+))/i)
      ?.slice(1)
      .find(Boolean) ?? text.match(/^--([^\r\n]+)\r?\n/)?.[1];
  const delimiter = boundary ? `--${boundary}` : "";
  const parts = delimiter ? text.split(delimiter) : [];
  if (parts.length < 3 || parts[0].trim() || !/^--\s*$/.test(parts.at(-1))) {
    if (text !== REDACTED) add(issues, path, "unparseable multipart body");
    return REDACTED;
  }
  const output = [""];
  for (const part of parts.slice(1, -1)) {
    const match = part.match(/^\r?\n([\s\S]*?)\r?\n\r?\n([\s\S]*?)\r?\n$/);
    const name = match?.[1].match(/content-disposition:[^\r\n]*\bname="([^"]+)"/i)?.[1];
    if (!match || !name) {
      add(issues, path, "unparseable multipart body");
      return REDACTED;
    }
    const decodedFile = normalizeKey(name) === "filecontent" ? decodeBase64Text(match[2]) : null;
    const cleanText = sensitive(name)
      ? redactLeaves(match[2], path, issues, 0)
      : scrubText(decodedFile ?? match[2], path, issues);
    const clean = decodedFile === null ? cleanText : Buffer.from(cleanText).toString("base64");
    output.push(`\r\n${scrubText(match[1], path, issues)}\r\n\r\n${clean}\r\n`);
  }
  output.push("--\r\n");
  return output.join(response ? delimiter : "--HAR_REDACTED_BOUNDARY");
};
const bodyText = (container, path, issues, apiKeyResponse = false, secretPayload = false, response = false) => {
  if (container.encoding !== undefined && container.encoding !== "base64") fail(path, "unsupported HAR encoding");
  if (container.text === undefined) return;
  if (
    typeof container.text !== "string" ||
    (container.mimeType !== undefined && typeof container.mimeType !== "string")
  )
    fail(path, "invalid HAR body");
  if (container.text === "") return;
  const mime = (container.mimeType ?? "").split(";")[0].trim().toLowerCase();
  const jsonMime = mime === "application/json" || mime === "text/json" || mime.endsWith("+json");
  const textMime =
    !mime ||
    mime.startsWith("text/") ||
    jsonMime ||
    [
      "application/xml",
      "application/javascript",
      "application/x-www-form-urlencoded",
      "multipart/form-data",
      "application/yaml",
      "application/x-yaml",
    ].includes(mime) ||
    mime.endsWith("+xml");
  let text = container.text;
  if (container.encoding === "base64") {
    text = decodeBase64Text(text);
    if (text === null && textMime) fail(path, "invalid base64 or UTF-8 body");
  }
  const recognizedJson =
    text !== null &&
    /^\s*[\[{]/.test(text) &&
    (() => {
      try {
        JSON.parse(text);
        return true;
      } catch {
        return false;
      }
    })();
  if (response && !textMime && text === null) {
    add(issues, path, "unsupported binary response body");
    delete container.text;
    return;
  }
  if (text === null) fail(path, "invalid base64 or UTF-8 body");
  let clean;
  if (jsonMime || recognizedJson) {
    const value = parseJson(text, path);
    let keyChanged = false;
    if (apiKeyResponse && object(value) && value.key !== undefined && !safeValue(value.key)) {
      add(issues, path, "API key response");
      value.key = typeof value.key === "number" ? REDACTED_NUMBER : `om_${REDACTED}`;
      keyChanged = true;
    }
    const output = walk(value, path, issues, 0, secretPayload ? "secretPayload" : "");
    clean = JSON.stringify(value) === JSON.stringify(output) && !keyChanged ? text : JSON.stringify(output);
  } else if (mime === "application/x-www-form-urlencoded") clean = scrubPairs(text, path, issues, 0);
  else if (mime === "multipart/form-data") {
    clean = scrubMultipart(text, container.mimeType, path, issues, response);
    if (!response) container.mimeType = "multipart/form-data; boundary=HAR_REDACTED_BOUNDARY";
  } else clean = scrubText(text, path, issues);
  container.text = container.encoding === "base64" ? Buffer.from(clean).toString("base64") : clean;
};
const endpointPath = (rawUrl) => {
  const url = new URL(rawUrl, "https://har.invalid");
  const endpoint = url.searchParams.get("endpoint");
  return endpoint ? new URL(endpoint, "https://har.invalid").pathname : url.pathname;
};
const transformHar = (value, issues) => {
  const clone = cloneJson(value);
  validateHar(clone);
  clone.log.entries.forEach((entry, index) => {
    const path = `$.log.entries[${index}]`;
    if (!/^https?:\/\//i.test(entry.request.url)) fail(`${path}.request.url`, "invalid HAR URL");
    scrubUrl(entry.request.url, `${path}.request.url`, issues, 0);
    if (entry.request.queryString?.length) {
      const url = new URL(entry.request.url);
      url.search = new URLSearchParams(entry.request.queryString.map(({ name, value }) => [name, value])).toString();
      scrubUrl(url.toString(), `${path}.request.queryString`, issues, 0);
    }
    const endpoint = endpointPath(entry.request.url);
    const secret = /\/secrets?(?:\/|$)/i.test(endpoint);
    if (entry.request.postData)
      bodyText(entry.request.postData, `${path}.request.postData.text`, issues, false, secret);
    bodyText(
      entry.response.content,
      `${path}.response.content.text`,
      issues,
      /(?:api[-_]?keys?|\/token)(?:\/|$)/i.test(endpoint),
      secret,
      true
    );
    for (const side of ["request", "response"]) {
      if (entry[side].cookies?.length) add(issues, `${path}.${side}.cookies`, "cookie state");
      entry[side].cookies = [];
    }
  });
  return walk(clone, "$", issues);
};
const replayHar = (har) => ({
  log: {
    ...(har.log.version !== undefined ? { version: har.log.version } : {}),
    ...(har.log.creator !== undefined
      ? {
          creator: Object.fromEntries(
            ["name", "version"]
              .filter((key) => har.log.creator[key] !== undefined)
              .map((key) => [key, har.log.creator[key]])
          ),
        }
      : {}),
    entries: har.log.entries.map(({ request, response }) => ({
      request: {
        method: request.method,
        url: request.url,
        ...(request.postData?.text !== undefined ? { postData: sanitizePostData(request.postData, request.url) } : {}),
      },
      response: {
        status: response.status,
        ...(response.statusText !== undefined ? { statusText: response.statusText } : {}),
        headers: (response.headers ?? [])
          .filter(({ name }) => ["content-type", "content-disposition", "location"].includes(name.toLowerCase()))
          .map(({ name, value }) => ({ name, value })),
        content: Object.fromEntries(
          ["mimeType", "encoding", "text", "size"]
            .filter((key) => response.content[key] !== undefined)
            .map((key) => [key, response.content[key]])
        ),
        bodySize: response.bodySize ?? response.content.size ?? 0,
      },
    })),
  },
});
export const sanitizeHar = (value) => {
  try {
    return replayHar(transformHar(value, []));
  } catch (error) {
    if (error instanceof SafeFailure) throw error;
    fail("$", "HAR sanitation failed");
  }
};
export const sanitizeUrl = (value) => {
  try {
    if (typeof value !== "string") fail("$.url", "invalid URL value");
    return scrubUrl(value, "$.url", [], 0);
  } catch (error) {
    if (error instanceof SafeFailure) throw error;
    fail("$.url", "URL sanitation failed");
  }
};
export function sanitizePostData(value, url) {
  const clone = cloneJson(value);
  if (!object(clone)) fail("$.postData", "invalid HAR post data");
  bodyText(clone, "$.postData.text", [], false, url !== undefined && /\/secrets?(?:\/|$)/i.test(endpointPath(url)));
  const text = clone.encoding === "base64" && clone.text !== undefined ? decodeBase64Text(clone.text) : clone.text;
  return {
    ...(clone.mimeType !== undefined ? { mimeType: clone.mimeType } : {}),
    ...(text !== undefined ? { text } : {}),
  };
}
export const inspectHar = (value) => {
  const issues = [];
  try {
    transformHar(value, issues);
  } catch (error) {
    issues.push(error instanceof SafeFailure ? error.issue : { path: "$", reason: "HAR inspection failed" });
  }
  return issues;
};
export const assertSafeHar = (value, label = "HAR") => {
  const issues = inspectHar(value);
  if (issues.length)
    throw new SafeFailure(
      `${typeof label !== "string" || label === "HAR" ? "HAR" : fileLabel(label)}${issues[0].path}`,
      issues[0].reason
    );
};
export const inspectFixture = (value) => {
  const issues = [];
  try {
    walk(cloneJson(value), "$", issues);
  } catch (error) {
    issues.push(error instanceof SafeFailure ? error.issue : { path: "$", reason: "fixture inspection failed" });
  }
  return issues;
};
export const sanitizeFixture = (value) => {
  try {
    return walk(cloneJson(value), "$", []);
  } catch (error) {
    if (error instanceof SafeFailure) throw error;
    fail("$", "fixture sanitation failed");
  }
};
export const sanitizeDiagnostic = (value) => {
  try {
    const clean = sanitizeFixture(value);
    return (typeof clean === "string" ? clean : JSON.stringify(clean)).slice(0, 300);
  } catch {
    return REDACTED;
  }
};
export const assertSafeFixture = (value, label = "fixture") => {
  const issues = inspectFixture(value);
  if (issues.length)
    throw new SafeFailure(
      `${typeof label !== "string" || label === "fixture" ? "fixture" : fileLabel(label)}${issues[0].path}`,
      issues[0].reason
    );
};
const gitRepo = (path) => {
  try {
    return execFileSync("git", ["-C", path, "rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
};
const trackedJson = (root) => {
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
};
const authState = (value) => object(value) && Array.isArray(value.cookies) && Array.isArray(value.origins);
export const runtimeArtifact = (path) =>
  /(?:^|[\\/])test-results[\\/](?:auth(?:[\\/]|$)|global-state\.json$)/i.test(resolve(path));
const fixtureSuffix = /\.(?:har|json)(?:\.gz)?$/i;
const corpusTooling = /^(?:scripts\/|\.github\/|README\.md$|\.gitignore$|\.gitattributes$)/;
const corpusRelative = (path, roots) => {
  const root = roots
    .map((candidate) => resolve(candidate))
    .find((candidate) => path === candidate || path.startsWith(candidate + sep));
  return root ? relative(root, path).split(sep).join("/") : "";
};
const readJsonFile = async (path) => {
  const info = await lstat(path);
  if (info.size > MAX_BYTES) fail(fileLabel(path), "fixture size limit exceeded");
  const data = await readFile(path);
  const bytes = /\.gz$/i.test(path) ? gunzipSync(data, { maxOutputLength: MAX_BYTES }) : data;
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  return { value: JSON.parse(text), mode: info.mode };
};
/** Scan all HAR/JSON fixtures. Validate the complete sanitation plan before replacing files. */
export const scanFixtures = async (paths, options = {}) => {
  const result = { harFiles: 0, fixtureFiles: 0, issues: [], changedFiles: [] };
  const files = new Set();
  const roots = Array.isArray(paths) ? paths : [];
  if (!Array.isArray(paths)) result.issues.push({ path: "$", reason: "invalid fixture roots" });
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
      for (const name of names.sort()) if (name !== ".git") await visit(join(path, name));
    } else if (info.isFile()) files.add(path);
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
      if (runtimeArtifact(path)) {
        result.issues.push({ path: label, reason: "runtime auth artifacts are not publishable" });
        continue;
      }
      if (!fixtureSuffix.test(path)) {
        if (!corpusTooling.test(corpusRelative(path, roots)))
          result.issues.push({ path: label, reason: "unexpected file in HAR corpus" });
        continue;
      }
      const { value, mode } = await readJsonFile(path);
      const isAuth = !isHar && authState(value);
      if (isHar && object(value) && object(value.log) && Array.isArray(value.log.entries))
        harEntries += value.log.entries.length;

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
      if (!isHar && fixtureSuffix.test(path) && !countedFixture) result.fixtureFiles++;
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
      const temporary = join(dirname(planned.path), `.${randomUUID()}.tmp`);
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
      }
    }
  return result;
};
/** CLI support: add git-tracked storage-state paths, including those outside corpus roots. */
export const trackedAuthRoots = async (paths, cwd = process.cwd()) => {
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
};
/** Inspect actual index bytes so clean worktree files cannot hide staged auth credentials. */
export const inspectTrackedAuth = async (paths, cwd = process.cwd()) => {
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
};
/** Read every indexed fixture in the selected corpus, including retained unmodified snapshots. */
export const scanStagedFixtures = async (paths, options = {}) => {
  const result = { harFiles: 0, fixtureFiles: 0, issues: [], changedFiles: [] };
  // Git reports real paths, so compare them with real roots (macOS tmp is a symlink).
  const roots = Array.isArray(paths)
    ? paths
        .filter((path) => typeof path === "string" && path)
        .map((path) => {
          try {
            return realpathSync(resolve(path));
          } catch {
            return resolve(path);
          }
        })
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
      if (!roots.some((root) => within(path, root)) || relative(repo, path).split(sep).includes(".git")) continue;
      const label = `${fileLabel(path)}.index`;
      if (fields[0] === "120000") {
        result.issues.push({ path: label, reason: "symbolic fixture paths are unsupported" });
        continue;
      }
      if (runtimeArtifact(path)) {
        result.issues.push({ path: label, reason: "runtime auth artifacts are not publishable" });
        continue;
      }
      if (!fixtureSuffix.test(path)) {
        if (!corpusTooling.test(corpusRelative(path, roots)))
          result.issues.push({ path: label, reason: "unexpected file in HAR corpus" });
        continue;
      }
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
        const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        const value = fixtureSuffix.test(path) ? JSON.parse(text) : text;
        if (typeof value === "string" && /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value))
          fail(label, "unsupported binary fixture");
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
};

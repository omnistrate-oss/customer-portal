import assert from "node:assert/strict";
import { test } from "node:test";

import { parseOpenAPIJSON } from "./downloadOpenAPIJSON.mjs";

const spec = {
  openapi: "3.0.3",
  info: { title: "Example API", version: "1.0" },
  paths: { "/example": { get: { responses: { 200: { description: "OK" } } } } },
};

test("reads a direct JSON specification", () => {
  assert.deepEqual(JSON.parse(parseOpenAPIJSON(JSON.stringify(spec))), spec);
});

test("reads the embedded Redoc definition without a download link", () => {
  const html = `<html><script>const __redoc_definition = ${JSON.stringify(spec)};
    const __redoc_options = {}; hydrate(__redoc_definition);</script></html>`;
  assert.deepEqual(JSON.parse(parseOpenAPIJSON(html)), spec);
});

test("preserves nested values and script-like text without executing it", () => {
  const described = { ...spec, info: { ...spec.info, description: "}; const __redoc_options = {}; + & \\" } };
  const html = `<script>const __redoc_definition = ${JSON.stringify(described)};
    const __redoc_options = {};</script>`;
  assert.deepEqual(JSON.parse(parseOpenAPIJSON(html)), described);
});

test("rejects error pages and malformed JSON with a fixed diagnostic", () => {
  for (const content of ["<html>Access denied</html>", "{invalid}", ""]) {
    assert.throws(() => parseOpenAPIJSON(content), /OpenAPI JSON was not found in the response/);
  }
});

test("rejects JSON that is not an OpenAPI specification", () => {
  for (const value of [null, [], {}, { ...spec, openapi: "2.0" }, { ...spec, paths: [] }, { ...spec, info: {} }]) {
    assert.throws(() => parseOpenAPIJSON(JSON.stringify(value)), /valid OpenAPI 3 specification/);
  }
});

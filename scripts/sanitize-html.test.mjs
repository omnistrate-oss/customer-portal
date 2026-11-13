import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeHTML } from "../src/utils/sanitizeHTML.ts";

test("removes provider forms and their controls", () => {
  const html = sanitizeHTML('<form action="https://evil.example"><input name="p"><button>Go</button></form>');
  assert.doesNotMatch(html, /<(form|input|button)\b/i);
});

test("removes style elements and their contents", () => {
  const html = sanitizeHTML("<style>body{display:none}</style><p>x</p>");
  assert.doesNotMatch(html, /<style\b|display/i);
});

test("keeps text alignment and removes layout styles", () => {
  const html = sanitizeHTML('<p style="text-align: center; position: fixed; top: 0">x</p>');
  assert.match(html, /style="text-align: center"/);
  assert.doesNotMatch(html, /position|top/i);
});

test("preserves pre-wrapped whitespace", () => {
  const html = sanitizeHTML('<span style="white-space: pre-wrap;">a  b</span>');
  assert.match(html, /style="white-space: pre-wrap"/);
});

test("removes style attributes containing only unsafe declarations", () => {
  const html = sanitizeHTML('<p style="background: url(https://evil.example/x)">x</p>');
  assert.doesNotMatch(html, /\bstyle=/i);
});

test("protects links opening a new tab", () => {
  const html = sanitizeHTML('<a href="https://example.com" target="_blank">x</a>');
  assert.match(html, /\brel="noopener noreferrer"/);
});

test("removes JavaScript link destinations", () => {
  const html = sanitizeHTML('<a href="javascript:alert(1)">x</a>');
  assert.doesNotMatch(html, /href=["']javascript:/i);
});

test("accepts missing HTML", () => {
  assert.equal(sanitizeHTML(undefined), "");
  assert.equal(sanitizeHTML(null), "");
});

import assert from "node:assert/strict";
import test from "node:test";

import { generateRandomPassword } from "../src/utils/generateRandomPassword.ts";

test("returns 12 letters and digits by default", () => {
  assert.match(generateRandomPassword(), /^[a-zA-Z0-9]{12}$/);
});

test("honors the requested length", () => {
  assert.equal(generateRandomPassword(40).length, 40);
});

test("uses every allowed character and does not repeat itself", () => {
  const passwords = Array.from({ length: 500 }, () => generateRandomPassword());
  assert.equal(new Set(passwords).size, passwords.length);
  assert.equal(new Set(passwords.join("")).size, 62);
});

import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizeOpenAPIOperationIds } from "./normalizeOpenAPIOperationIds.mjs";

const spec = {
  openapi: "3.0.3",
  info: { title: "Example API", version: "1.0" },
  paths: {
    "/invite-user": {
      post: { operationId: "InviteUser", tags: ["users-api"], responses: { 200: { description: "OK" } } },
    },
    "/subscriptions/{subscriptionId}/invite-user": {
      parameters: [{ in: "path", name: "subscriptionId", required: true, schema: { type: "string" } }],
      post: {
        operationId: "InviteUser",
        tags: ["consumption-user-api"],
        responses: { 200: { description: "OK" } },
      },
    },
  },
};

test("separates identically named operations in different API groups", () => {
  const normalized = JSON.parse(normalizeOpenAPIOperationIds(JSON.stringify(spec)));
  assert.equal(normalized.paths["/invite-user"].post.operationId, "users-api/InviteUser");
  assert.equal(
    normalized.paths["/subscriptions/{subscriptionId}/invite-user"].post.operationId,
    "consumption-user-api/InviteUser"
  );
  assert.deepEqual(normalized.paths["/invite-user"].post.responses, spec.paths["/invite-user"].post.responses);
  assert.deepEqual(
    normalized.paths["/subscriptions/{subscriptionId}/invite-user"].parameters,
    spec.paths["/subscriptions/{subscriptionId}/invite-user"].parameters
  );
});

test("does not add a second prefix when regenerating an already normalized specification", () => {
  const normalized = normalizeOpenAPIOperationIds(JSON.stringify(spec));
  assert.equal(normalizeOpenAPIOperationIds(normalized), normalized);
});

test("rejects operation IDs that still collide within the same API group", () => {
  const conflicting = structuredClone(spec);
  conflicting.paths["/subscriptions/{subscriptionId}/invite-user"].post.tags = ["users-api"];
  assert.throws(
    () => normalizeOpenAPIOperationIds(JSON.stringify(conflicting)),
    /Duplicate OpenAPI operation ID after normalization: users-api\/InviteUser/
  );
});

test("leaves operations without IDs and path-level parameters unchanged", () => {
  const content = JSON.stringify({ ...spec, paths: { "/example": { get: { responses: {} }, parameters: [] } } });
  assert.deepEqual(JSON.parse(normalizeOpenAPIOperationIds(content)), JSON.parse(content));
});

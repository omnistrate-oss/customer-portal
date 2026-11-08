const HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];

/** Preserves the portal's tag-prefixed operation names and rejects IDs that would produce duplicate types. */
export const normalizeOpenAPIOperationIds = (content) => {
  const spec = JSON.parse(content);
  const seen = new Set();

  for (const item of Object.values(spec.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = item[method];
      if (!operation || typeof operation.operationId !== "string") continue;

      const tag = operation.tags?.[0];
      if (typeof tag === "string" && tag && !operation.operationId.startsWith(`${tag}/`)) {
        operation.operationId = `${tag}/${operation.operationId}`;
      }

      if (seen.has(operation.operationId)) {
        throw new Error(`Duplicate OpenAPI operation ID after normalization: ${operation.operationId}`);
      }
      seen.add(operation.operationId);
    }
  }

  return JSON.stringify(spec, null, 2);
};

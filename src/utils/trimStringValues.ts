/**
 * Trims leading and trailing whitespace from all string values in an object.
 * Non-string values are left unchanged.
 */
export function trimStringValues<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    if (typeof result[key] === "string") {
      (result as Record<string, unknown>)[key] = (result[key] as string).trim();
    }
  }
  return result;
}

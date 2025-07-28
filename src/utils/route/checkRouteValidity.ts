import { PAGE_TITLE_MAP } from "src/constants/pageTitleMap";

// Dynamic route patterns that are valid in the application
const DYNAMIC_ROUTE_PATTERNS = [
  // Instance details routes
  "/instances/[serviceId]/[servicePlanId]/[resourceId]/[instanceId]/[subscriptionId]",
];

const checkRouteValidity = (path: string) => {
  // Combine static routes from PAGE_TITLE_MAP and dynamic route patterns
  const allPatterns = [...Object.keys(PAGE_TITLE_MAP), ...DYNAMIC_ROUTE_PATTERNS];

  return allPatterns.some((pattern) => {
    // Convert Next.js route pattern to regex
    // The first replace() converts dynamic route segments like '[serviceId]' into regex capture groups '([^/]+)',
    // which match any sequence of characters except '/'. The second replace() escapes '/' characters to ensure
    // they are treated as literal slashes in the regex. This allows us to match paths against the pattern.
    const regexPattern = pattern
      .replace(/\\/g, "\\\\") // Escape backslashes
      .replace(/\[([^\]]+)\]/g, "([^/]+)") // Replace dynamic segments
      .replace(/\//g, "\\/"); // Escape forward slashes
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  });
};

export default checkRouteValidity;

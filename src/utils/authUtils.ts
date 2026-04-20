export const removeBaseDomainFromUrl = (url: string, baseDomain: string): string => {
  if (url.startsWith(baseDomain)) {
    return url.slice(baseDomain.length);
  }
  return url;
};

export function checkIsNonProtectedEndpoint(url: string): boolean {
  const baseDomain = "/2022-09-01-00";
  url = removeBaseDomainFromUrl(url, baseDomain);
  const nonProtectedEndpoints = [
    "/change-password",
    "/contactus",
    "/health",
    "/json-schema",
    "/login-with-identity-provider",
    "/refresh-token",
    "/reset-password",
    "/resource-instance/health",
    "/resource-instance/version",
    "/signin",
    "/signup",
    "/validate-token",
    "/version",
    "/logout",
  ];

  return nonProtectedEndpoints.some((endpoint) => url.startsWith(endpoint));
}

// Backend may return 400 with messages such as "token is missing" or
// "token is missing from header" when the auth cookie is absent/empty.
// Treat these the same as 401 so the refresh-and-retry flow runs.
export function isAuthError(status: number, message?: string | null): boolean {
  if (status === 401) return true;
  if (status === 400 && message) {
    return /token.*missing(?:.*header)?/i.test(message);
  }
  return false;
}

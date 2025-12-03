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

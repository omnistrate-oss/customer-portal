const API_VERSION_PATH = "/2022-09-01-00";
const ACCOUNT_SETUP_PATH = "/account-setup/";
const VERSIONED_ACCOUNT_SETUP_PATH = `${API_VERSION_PATH}${ACCOUNT_SETUP_PATH}`;
const ACCOUNT_SETUP_URL_PATTERN = /https?:\/\/[^\s"'`)]+/g;

const getAccountSetupEndpoint = (downloadURL: string): string => {
  if (!downloadURL) return "";

  try {
    const url = new URL(downloadURL, "https://customer-portal.invalid");
    const versionedPath = url.pathname.startsWith(VERSIONED_ACCOUNT_SETUP_PATH)
      ? url.pathname
      : url.pathname.startsWith(ACCOUNT_SETUP_PATH)
        ? `${API_VERSION_PATH}${url.pathname}`
        : "";

    return versionedPath ? `${versionedPath}${url.search}` : "";
  } catch {
    return "";
  }
};

export const getAccountSetupProxyUrl = (downloadURL: string, absolute = false): string => {
  const endpoint = getAccountSetupEndpoint(downloadURL);
  if (!endpoint) return "";

  const relativeURL = `/api/action?endpoint=${encodeURIComponent(endpoint)}`;
  if (!absolute || typeof window === "undefined") return relativeURL;

  return `${window.location.origin}${relativeURL}`;
};

export const accountSetupUrlsWithProxy = (command: string, absolute = false): string => {
  if (!command) return command;

  return command.replace(ACCOUNT_SETUP_URL_PATTERN, (rawURL) => getAccountSetupProxyUrl(rawURL, absolute) || rawURL);
};

const getSafeExternalURL = (url?: string) => {
  const candidateURL = url?.trim();

  if (!candidateURL || candidateURL === "#") {
    return "";
  }

  try {
    const parsedURL = new URL(candidateURL);
    const isAllowedProtocol =
      parsedURL.protocol === "https:" || (process.env.NODE_ENV !== "production" && parsedURL.protocol === "http:");

    return isAllowedProtocol ? parsedURL.toString() : "";
  } catch {
    return "";
  }
};

export default getSafeExternalURL;

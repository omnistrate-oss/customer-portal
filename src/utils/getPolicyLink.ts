import getSafeExternalURL from "src/utils/getSafeExternalURL";

export const getPolicyLink = (policy: string | undefined, fallbackPath: string): string =>
  getSafeExternalURL(policy?.trim()) || fallbackPath;

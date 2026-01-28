import { useMemo } from "react";

import { IdentityProvider } from "src/types/identityProvider";

function parseEmailIdentifiers(idp: IdentityProvider): string[] {
  if (!idp.emailIdentifiers || idp.emailIdentifiers === "") return [];
  return idp.emailIdentifiers.split(",").map((id) => id.trim());
}

export function useFilteredIdentityProviders(identityProviders: IdentityProvider[], userEmail: string) {
  const emailDomain = userEmail?.includes("@") ? userEmail.split("@")[1] || "" : "";

  const hasIDPWithMatchingDomain = useMemo(() => {
    return (
      identityProviders.length > 0 &&
      identityProviders.some((idp) => parseEmailIdentifiers(idp).includes(emailDomain))
    );
  }, [identityProviders, emailDomain]);

  const domainFilteredIdentityProviders = useMemo(() => {
    if (!identityProviders.length) return [];

    const filtered = identityProviders.filter((idp) => {
      const identifiers = parseEmailIdentifiers(idp);
      if (identifiers.length === 0 && !hasIDPWithMatchingDomain) return true;
      return identifiers.includes(emailDomain);
    });

    // Sort: exact domain matches first
    return filtered.sort((a, b) => {
      const aMatch = parseEmailIdentifiers(a).includes(emailDomain);
      const bMatch = parseEmailIdentifiers(b).includes(emailDomain);
      if (aMatch && !bMatch) return -1;
      if (bMatch && !aMatch) return 1;
      return 0;
    });
  }, [identityProviders, emailDomain, hasIDPWithMatchingDomain]);

  return {
    emailDomain,
    hasIDPWithMatchingDomain,
    domainFilteredIdentityProviders,
  };
}

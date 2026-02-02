import { IdentityProvider } from "src/types/identityProvider";

export function getIdentityProviderButtonLabel(identityProvider: IdentityProvider) {
  return (
    identityProvider.loginButtonText?.trim() ||
    `Continue with ${identityProvider.name || identityProvider.identityProviderName}`
  );
}

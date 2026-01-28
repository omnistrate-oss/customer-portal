import extractQueryParam from "src/constants/extractQueryParam";
import { IdentityProvider } from "src/types/identityProvider";

type InvitationInfo = {
  invitedEmail?: string;
  legalCompanyName?: string;
  companyUrl?: string;
};

type HandleIDPButtonClickParams = {
  idp: IdentityProvider;
  userEmail: string;
  destination?: string | null;
  invitationInfo: InvitationInfo;
  affiliateCode?: string | null;
  onRedirect: (url: string) => void;
  onSetLoginMethod?: (method: { methodType: string; idpName: string }) => void;
};

export function buildInvitationInfo(params: {
  email?: string | null;
  org?: string | null;
  orgUrl?: string | null;
}): InvitationInfo {
  const { email, org, orgUrl } = params;
  const info: InvitationInfo = {};

  if (email) {
    info.invitedEmail = decodeURIComponent(email).trim();
  }
  if (org) {
    info.legalCompanyName = decodeURIComponent(org).trim();
  }
  if (orgUrl) {
    info.companyUrl = decodeURIComponent(orgUrl).trim();
  }

  return info;
}

export function handleIDPButtonClick(params: HandleIDPButtonClickParams) {
  const { idp, userEmail, destination, invitationInfo, affiliateCode, onRedirect, onSetLoginMethod } = params;

  const stateFromURL = extractQueryParam(idp.renderedAuthorizationEndpoint, "state");
  const state = idp.state;
  let redirectURL = idp.renderedAuthorizationEndpoint;

  if (!stateFromURL && state) {
    redirectURL += (redirectURL.includes("?") ? "&" : "?") + `state=${state}`;
  }
  redirectURL += (redirectURL.includes("?") ? "&" : "?") + `login_hint=${encodeURIComponent(userEmail)}`;

  const localAuthState: {
    destination: string | undefined | null;
    identityProvider: string;
    invitationInfo: InvitationInfo;
    nonce?: string;
    affiliateCode?: string;
  } = {
    destination: destination,
    identityProvider: idp.name || idp.identityProviderName,
    invitationInfo,
  };

  if (stateFromURL || state) {
    localAuthState.nonce = stateFromURL || state;
  }
  if (affiliateCode) {
    localAuthState.affiliateCode = decodeURIComponent(affiliateCode).trim();
  }

  const encodedLocalAuthState = Buffer.from(JSON.stringify(localAuthState), "utf8").toString("base64");
  sessionStorage.setItem("authState", encodedLocalAuthState);

  if (onSetLoginMethod) {
    onSetLoginMethod({
      methodType: idp.identityProviderName,
      idpName: idp.name,
    });
  }

  onRedirect(redirectURL);
}

export const omnstrateDomainRegex = /omnistrate\.com$/;

export const hideDashboardEndpoint = (accountID: string, email: string) => {
  return accountID === "OMNISTRATE_HOSTED" && !omnstrateDomainRegex.test(email);
};

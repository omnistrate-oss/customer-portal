import { RESOURCE_TYPES } from "src/constants/resource";

export const getTabs = (
  isMetricsEnabled,
  isLogsEnabled,
  isActive,
  isResourceBYOA,
  isCliManagedResource,
  resourceType,
  isBackup,
  isCustomDNS
) => {
  const tabs: Record<string, string | undefined> = {
    resourceInstanceDetails: "Instance Details",
    connectivity: "Connectivity",
    nodes: "Nodes",
  };
  if (isMetricsEnabled && !isResourceBYOA && !isCliManagedResource) tabs["metrics"] = "Metrics";
  if (isLogsEnabled && !isResourceBYOA) tabs["logs"] = "Live Logs";

  if (!isActive || resourceType === RESOURCE_TYPES.Terraform) {
    delete tabs.connectivity;
    delete tabs.nodes;
  }

  tabs["auditLogs"] = "Audit Logs";
  if (isBackup) {
    tabs["backups"] = "Backups";
    tabs["snapshots"] = "Snapshots";
  }
  if (isCustomDNS) {
    tabs["customDNS"] = "Custom DNS";
  }

  return tabs;
};

export const checkCustomDNSEndpoint = (resources) => {
  if (resources.primary?.customDNSEndpoint && resources.primary?.customDNSEndpoint.enabled === true) {
    return true;
  }

  if (Array.isArray(resources.others)) {
    return resources.others.some(
      (resource) => resource.customDNSEndpoint && resource.customDNSEndpoint.enabled === true
    );
  }

  return false;
};

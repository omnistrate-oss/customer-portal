export const loadStatusMap = {
  POD_IDLE: "Low",
  POD_NORMAL: "Medium",
  POD_OVERLOAD: "High",

  LOAD_IDLE: "Low",
  LOAD_NORMAL: "Medium",
  LOAD_OVERLOADED: "High",

  STOPPED: "N/A",
  UNKNOWN: "Unknown",
  "N/A": "N/A",
};

export const loadStatusLabel = {
  Low: "Idle",
  Medium: "Normal",
  High: "High",
};

export const customTagsInitializer = { key: "", value: "" };

export const REQUEST_PARAMS_FIELDS_TO_FILTER = [
  "id",
  "cloud_provider",
  "region",
  "custom_network_id",
  "custom_availability_zone",
  "subscriptionId",
  "cloud_provider_native_network_id",
  "custom_dns_configuration",
];

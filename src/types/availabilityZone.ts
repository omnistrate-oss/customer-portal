import type { paths } from "./schema";

export type AvailabilityZone =
  paths["/2022-09-01-00/availability-zone/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

export type ListAvailabilityZonesByRegionCodeSuccessResponse =
  paths["/2022-09-01-00/availability-zone/region/code/{regionCode}/cloud-provider/{cloudProviderName}"]["get"]["responses"]["200"]["content"]["application/json"] & {
    availabilityZones: AvailabilityZone[];
  };

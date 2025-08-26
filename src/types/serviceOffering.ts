import type { components, paths } from "./schema";

export type ListServiceOfferingSuccessResponse =
  paths["/2022-09-01-00/service-offering"]["get"]["responses"]["200"]["content"]["application/json"];

export type DescribeServiceOfferingResourceSuccessResponse =
  paths["/2022-09-01-00/service-offering/{serviceId}/resource/{resourceId}/instance/{instanceId}"]["get"]["responses"]["200"]["content"]["application/json"];

export type APIEntity = components["schemas"]["APIEntity"];

export type Service = components["schemas"]["DescribeServiceOfferingResult"];

export type Offering = components["schemas"]["ServiceOffering"];

export type ServiceOffering = Omit<Service, "offerings"> & Offering;


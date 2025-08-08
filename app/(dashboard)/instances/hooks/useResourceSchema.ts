import { useQuery } from "@tanstack/react-query";

import { describeServiceOfferingResource } from "src/api/serviceOffering";

type QueryParams = {
  serviceId?: string;
  resourceId?: string;
  instanceId?: string;
  productTierId?: string;
  productTierVersion?: string;
};

const useResourceSchema = (queryParams: QueryParams = {}, queryOptions = { enabled: true }) => {
  const { serviceId, resourceId, instanceId = "none", productTierId, productTierVersion } = queryParams;
  const isEnabled = Boolean(serviceId && resourceId);

  const query = useQuery({
    queryKey: ["resource-schema", serviceId, resourceId, instanceId, productTierId, productTierVersion],
    queryFn: () => describeServiceOfferingResource(serviceId!, resourceId!, instanceId, productTierId, productTierVersion),
    ...queryOptions,
    enabled: isEnabled && queryOptions.enabled,
    select: (response) => {
      return response.data;
    },
  });

  return query;
};

export default useResourceSchema;

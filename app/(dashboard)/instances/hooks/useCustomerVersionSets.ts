import { $api } from "src/api/query";

export default function useCustomerVersionSets(
  queryParams: { serviceId?: string; productTierId?: string },
  queryOptions = {}
) {
  const { serviceId, productTierId } = queryParams;
  return $api.useQuery(
    "get",
    "/2022-09-01-00/service/{serviceId}/productTier/{productTierId}/customer-version-set",
    {
      params: {
        path: {
          serviceId: serviceId || "",
          productTierId: productTierId || "",
        },
      },
    },
    {
      select: (data) => data.tierVersionSets,
      enabled: !!serviceId && !!productTierId,
      ...queryOptions,
    }
  );
}

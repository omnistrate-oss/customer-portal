import { $api } from "src/api/query";

type QueryOptions = {
  onlyInstances?: boolean;
  [key: string]: any;
};

const useInstancesDescribe = (queryOptions: QueryOptions = {}) => {
  const { ...options } = queryOptions;

  const query = $api.useQuery(
    "get",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}",
    {
      params: {
        path: {
          serviceProviderId: queryOptions.serviceProviderId,
          serviceKey: queryOptions.serviceKey,
          serviceAPIVersion: queryOptions.serviceAPIVersion,
          serviceEnvironmentKey: queryOptions.serviceEnvironmentKey,
          serviceModelKey: queryOptions.serviceModelKey,
          productTierKey: queryOptions.productTierKey,
          resourceKey: queryOptions.resourceKey,
          id: queryOptions.id,
        },
      },
    },
    {
      select: (data) => {
        // If the API returns the instance directly, just return data
        return data;
      },
      ...options,
    }
  );

  return query;
};

export default useInstancesDescribe;

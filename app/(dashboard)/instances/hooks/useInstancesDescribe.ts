import { $api } from "src/api/query";

type QueryOptions = {
  serviceProviderId: string;
  serviceKey: string;
  serviceAPIVersion: string;
  serviceEnvironmentKey: string;
  serviceModelKey: string;
  productTierKey: string;
  resourceKey: string;
  id: string;
  [key: string]: any;
};

const useInstancesDescribe = (queryOptions: QueryOptions) => {
  const {
    serviceProviderId,
    serviceKey,
    serviceAPIVersion,
    serviceEnvironmentKey,
    serviceModelKey,
    productTierKey,
    resourceKey,
    id,
    ...options
  } = queryOptions;

  const query = $api.useQuery(
    "get",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}",
    {
      params: {
        path: {
          serviceProviderId,
          serviceKey,
          serviceAPIVersion,
          serviceEnvironmentKey,
          serviceModelKey,
          productTierKey,
          resourceKey,
          id,
        },
      },
    },
    {
      ...options,
    }
  );

  return query;
};

export default useInstancesDescribe;

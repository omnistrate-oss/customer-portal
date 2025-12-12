import { $api } from "src/api/query";
import useEnvironmentType from "src/hooks/useEnvironmentType";
import { ServiceOffering } from "src/types/serviceOffering";

const path = "/2022-09-01-00/service-offering";
const useOrgServiceOfferings = (queryOptions = {}) => {
  const environmentType = useEnvironmentType();
  const query = $api.useQuery(
    "get",
    path,
    {
      params: {
        query: {
          environmentType,
        },
      },
    },
    {
      select: (data) => {
        const services = data.services || [];
        const serviceOfferings: ServiceOffering[] = [];

        services.forEach((service) => {
          service?.offerings.forEach((offering) => {
            const offeringData = {
              ...service,
              ...offering,
            };

            // @ts-ignore
            delete offeringData.offerings;

            serviceOfferings.push(offeringData);
          });
        });

        serviceOfferings.sort(
          // @ts-ignore
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        return serviceOfferings;
      },
      retry: (failureCount, error) => {
        console.warn(path, `[Attempt ${failureCount + 1} Failed] Retrying...`, error);
        const MAX_RETRIES = 3;
        return failureCount < MAX_RETRIES;
      },
      ...queryOptions,
    }
  );

  return query;
};

export default useOrgServiceOfferings;

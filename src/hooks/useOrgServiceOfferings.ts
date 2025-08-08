import { useQuery } from "@tanstack/react-query";

import { listServiceOfferings } from "src/api/serviceOffering";
import useEnvironmentType from "src/hooks/useEnvironmentType";
import { ServiceOffering } from "src/types/serviceOffering";

function useOrgServiceOfferings(queryOptions = {}) {
  const environmentType = useEnvironmentType();
  const query = useQuery({
    queryKey: ["org-service-offerings"],
    queryFn: () => listServiceOfferings({ environmentType: environmentType }),
    select: (data) => {
      const services = data.data?.services || [];
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
    retry: 2,
    ...queryOptions,
  });

  return query;
}

export default useOrgServiceOfferings;

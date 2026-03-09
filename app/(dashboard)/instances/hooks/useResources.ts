import { $api } from "src/api/query";

import { Resource } from "../../../../src/types/resource";

function useResources(queryParams, queryOptions = {}) {
  const { serviceId, productTierId, productTierVersion, isInjectedAccountConfig = false } = queryParams;

  const query = $api.useQuery(
    "get",
    "/2022-09-01-00/service/{serviceId}/producttier/{productTierId}/resource",
    {
      params: {
        path: {
          serviceId,
          productTierId,
        },
        query: {
          ProductTierVersion: productTierVersion,
        },
      },
    },
    {
      enabled: Boolean(serviceId && productTierId),
      select: (data) => {
        let resourceIds: string[] = [];
        let resources: Resource[] = [];

        if (data.resources) {
          resources = data.resources;
          resourceIds = data.ids;
        }

        if (isInjectedAccountConfig) {
          //filter out observability resource
          return {
            resources: resources
              .filter((resource) => !resource?.id?.includes("r-obsrv"))
              .map((resource) => {
                return {
                  ...resource,
                  dependencies: (resource.dependencies || []).filter(
                    (dependency) => !dependency?.resourceId?.includes("r-obsrv")
                  ),
                };
              }),
            resourceIds: resourceIds.filter((resourceId) => !resourceId?.includes("r-obsrv")),
          };
        } else {
          //filter out observability, cloud provider account resource
          return {
            resources: resources
              .filter(
                (resource) => !(resource?.id?.includes("r-obsrv") || resource?.id?.includes("r-injectedaccountconfig"))
              )
              .map((resource) => {
                return {
                  ...resource,
                  dependencies: (resource.dependencies || []).filter(
                    (dependency) =>
                      !(
                        dependency?.resourceId?.includes("r-obsrv") ||
                        dependency?.resourceId?.includes("r-injectedaccountconfig")
                      )
                  ),
                };
              }),
            resourceIds: resourceIds.filter(
              (resourceId) => !(resourceId?.includes("r-obsrv") || resourceId?.includes("r-injectedaccountconfig"))
            ),
          };
        }
      },
      ...queryOptions,
    }
  );

  return query;
}

export default useResources;

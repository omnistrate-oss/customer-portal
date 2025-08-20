import { $api } from "src/api/query";
import useEnvironmentType from "src/hooks/useEnvironmentType";
import { paths } from "src/types/schema";

const useInstances = (queryOptions = {}) => {
  const query = $api.useQuery(
    "get",
    "/2022-09-01-00/resource-instance",
    {
      params: {
        query: {
          environmentType: useEnvironmentType(),
        },
      },
    },
    {
      select: (data) =>
        data.resourceInstances.sort(
          (a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()
        ),
      refetchInterval: 60000,
      ...queryOptions,
    }
  );

  return query;
};
export type DeploymentInstance =
  paths["/2022-09-01-00/resource-instance"]["get"]["responses"]["200"]["content"]["application/json"]["resourceInstances"][number];

export default useInstances;

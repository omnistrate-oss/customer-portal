import { $api } from "src/api/query";
import useEnvironmentType from "src/hooks/useEnvironmentType";

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

export default useInstances;

import { $api } from "src/api/query";
import useEnvironmentType from "src/hooks/useEnvironmentType";
import { useAuthTokenContext } from "src/providers/AuthTokenProvider";

const useInstances = (queryOptions = {}) => {
  const { token } = useAuthTokenContext(); // Now reactive!

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
      enabled: Boolean(token), // Prevent refetch when no token
      ...queryOptions,
    }
  );

  return query;
};

export default useInstances;

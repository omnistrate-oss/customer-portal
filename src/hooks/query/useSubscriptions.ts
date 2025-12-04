import { $api } from "src/api/query";

import useEnvironmentType from "../useEnvironmentType";

// Before Making any Changes, Please Be Careful because we use the QueryClient to Update the Data when Unsubscribing

const useSubscriptions = (queryOptions = {}) => {
  const query = $api.useQuery(
    "get",
    "/2022-09-01-00/subscription",
    {
      params: {
        query: {
          environmentType: useEnvironmentType(),
        },
      },
    },
    {
      select: (data) => data.subscriptions,
      retry: (failureCount, error) => {
        console.warn("/2022-09-01-00/subscription", `[Attempt ${failureCount + 1} Failed] Retrying...`, error);
        const MAX_RETRIES = 3;
        return failureCount < MAX_RETRIES;
      },
      ...queryOptions,
    }
  );

  return query;
};

export default useSubscriptions;

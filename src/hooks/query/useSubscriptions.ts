import { $api } from "src/api/query";

import useEnvironmentType from "../useEnvironmentType";

// Before Making any Changes, Please Be Careful because we use the QueryClient to Update the Data when Unsubscribing

const path = "/2022-09-01-00/subscription";
const useSubscriptions = (queryOptions = {}) => {
  const query = $api.useQuery(
    "get",
    path,
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
        console.warn(path, `[Attempt ${failureCount + 1} Failed] Retrying...`, error);
        const MAX_RETRIES = 3;
        return failureCount < MAX_RETRIES;
      },
      ...queryOptions,
    }
  );

  return query;
};

export default useSubscriptions;

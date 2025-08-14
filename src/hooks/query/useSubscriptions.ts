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
      retry: 3,
      ...queryOptions,
    }
  );

  return query;
};

export default useSubscriptions;

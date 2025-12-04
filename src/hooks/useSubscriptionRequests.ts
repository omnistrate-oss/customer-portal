import { $api } from "src/api/query";

const useSubscriptionRequests = (queryOptions = {}) => {
  const query = $api.useQuery(
    "get",
    "/2022-09-01-00/subscription/request",
    {},
    {
      select: (data) => {
        return data.subscriptionRequests;
      },
      retry: (failureCount, error) => {
        console.warn("/2022-09-01-00/subscription/request", `[Attempt ${failureCount + 1} Failed] Retrying...`, error);
        const MAX_RETRIES = 3;
        return failureCount < MAX_RETRIES;
      },
      ...queryOptions,
    }
  );

  return query;
};

export default useSubscriptionRequests;

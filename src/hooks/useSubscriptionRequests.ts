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
      retry: 2,
      ...queryOptions,
    }
  );

  return query;
};

export default useSubscriptionRequests;

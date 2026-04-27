import { useMemo } from "react";
import { UseQueryOptions } from "@tanstack/react-query";
import useAllUsers from "app/(dashboard)/access-control/hooks/useAllUsers";

const useSubscriptionOwners = (queryOptions: Omit<UseQueryOptions, "queryKey" | "queryFn"> = {}) => {
  const query = useAllUsers(queryOptions);

  const subscriptionOwners = useMemo(() => {
    if (!query.data) return [];
    const seen = new Set<string>();
    return query.data.filter((user) => {
      if (user.roleType === "root" && !seen.has(user.userId)) {
        seen.add(user.userId);
        return true;
      }
      return false;
    });
  }, [query.data]);

  return { ...query, data: subscriptionOwners };
};

export default useSubscriptionOwners;

import { useMemo } from "react";

import { $api } from "src/api/query";
import useEnvironmentType from "src/hooks/useEnvironmentType";

const useSubscriptionOwners = () => {
  const environmentType = useEnvironmentType();

  const query = $api.useQuery("get", "/2022-09-01-00/subscription", {
    params: {
      query: {
        environmentType,
      },
    },
  });

  const subscriptionOwners = useMemo(() => {
    if (!query.data?.subscriptions) return [];

    const seen = new Set<string>();
    return query.data.subscriptions
      .filter((sub) => sub.status === "ACTIVE" && sub.rootUserOrgId)
      .reduce<{ userId: string; name: string; email: string; orgId: string }[]>((acc, sub) => {
        const orgId = sub.rootUserOrgId!;
        if (!seen.has(orgId)) {
          seen.add(orgId);
          acc.push({
            userId: orgId,
            name: sub.subscriptionOwnerName || sub.rootUserName || sub.rootUserOrgName || "",
            email: sub.serviceOrgName || sub.rootUserId,
            orgId,
          });
        }
        return acc;
      }, []);
  }, [query.data]);

  return { ...query, data: subscriptionOwners };
};

export default useSubscriptionOwners;

import { $api } from "src/api/query";
import useEnvironmentType from "src/hooks/useEnvironmentType";
import { isCloudAccountInstance } from "src/utils/access/byoaResource";

type QueryOptions = {
  onlyInstances?: boolean;
  [key: string]: any;
};

const useInstances = (queryOptions: QueryOptions = {}) => {
  const { onlyInstances, ...options } = queryOptions;

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
      select: (data) => {
        let res = data.resourceInstances;

        if (onlyInstances) {
          res = res.filter((instance) => !isCloudAccountInstance(instance));
        }

        return res.sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime());
      },
      refetchInterval: 60000,
      ...options,
    }
  );

  return query;
};

export default useInstances;

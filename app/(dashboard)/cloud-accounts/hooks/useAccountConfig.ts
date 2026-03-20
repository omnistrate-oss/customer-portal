import { $api } from "src/api/query";

type QueryOptions = {
  accountConfigId: string;
  [key: string]: any;
};

const useAccountConfig = (queryOptions: QueryOptions) => {
  const { accountConfigId, ...options } = queryOptions;

  const query = $api.useQuery(
    "get",
    "/2022-09-01-00/accountconfig/{id}",
    {
      params: {
        path: {
          id: accountConfigId,
        },
      },
      headers: {
        "x-ignore-global-error": true,
      },
    },
    {
      ...options,
    }
  );

  return query;
};

export default useAccountConfig;

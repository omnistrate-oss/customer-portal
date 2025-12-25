import { $api } from "src/api/query";

const useInstanceSnapshots = (queryOptions = {}) => {
  const query = $api.useQuery(
    "get",
    "/2022-09-01-00/resource-instance/snapshot",
    {},
    {
      select: (data) =>
        // @ts-expect-error createdTime exists on InstanceSnapshot but is marked optional
        data.snapshots?.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()) || [],
      ...queryOptions,
    }
  );
  return query;
};

export default useInstanceSnapshots;

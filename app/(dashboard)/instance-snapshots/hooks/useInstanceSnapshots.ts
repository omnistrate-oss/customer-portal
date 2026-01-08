import { $api } from "src/api/query";

const useInstanceSnapshots = (queryOptions = {}) => {
  const query = $api.useQuery(
    "get",
    "/2022-09-01-00/resource-instance/snapshot",
    {
      params: {
        query: {
          snapshotType: "ManualSnapshot",
        },
      },
    },
    {
      select: (data) =>
        data.snapshots?.sort((a, b) => {
          const timeB = new Date(b.createdTime ?? 0).getTime();
          const timeA = new Date(a.createdTime ?? 0).getTime();
          return timeB - timeA;
        }) || [],
      ...queryOptions,
    }
  );
  return query;
};

export default useInstanceSnapshots;

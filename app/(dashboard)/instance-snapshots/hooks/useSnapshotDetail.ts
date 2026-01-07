import { $api } from "src/api/query";

type UseSnapshotDetailParams = {
  snapshotId: string;
};

const useSnapshotDetail = ({ snapshotId }: UseSnapshotDetailParams) => {
  const isEnabled = Boolean(snapshotId);

  const query = $api.useQuery(
    "get",
    "/2022-09-01-00/resource-instance/snapshot/{id}",
    {
      params: {
        path: { id: snapshotId },
      },
    },
    {
      enabled: isEnabled,
    }
  );

  return query;
};

export default useSnapshotDetail;

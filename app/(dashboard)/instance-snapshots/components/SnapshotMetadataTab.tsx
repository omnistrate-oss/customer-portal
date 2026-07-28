import { useMemo } from "react";
import { Box } from "@mui/material";

import PropertyDetails, { Row } from "src/components/ResourceInstance/ResourceInstanceDetails/PropertyDetails";
import { InstanceSnapshot } from "src/types/instance-snapshot";

type SnapshotWithMetadata = InstanceSnapshot & {
  snapshotMetadata?: {
    backupId?: string;
    backupName?: string;
  };
};

type SnapshotMetadataTabProps = {
  snapshot: SnapshotWithMetadata;
};

const SnapshotMetadataTab: React.FC<SnapshotMetadataTabProps> = ({ snapshot }) => {
  const snapshotInfoRows: Row[] = useMemo(() => {
    if (!snapshot) return [];

    const { backupId, backupName } = snapshot.snapshotMetadata || {};

    return [
      { label: "Backup ID", value: backupId || "-", valueType: "text" },
      { label: "Backup Name", value: backupName || "-", valueType: "text" },
    ];
  }, [snapshot]);

  return (
    <Box sx={{ marginTop: "24px" }}>
      <PropertyDetails
        rows={{
          title: "Snapshot Metadata",
          desc: "Detailed metadata information about the snapshot",
          rows: snapshotInfoRows,
          flexWrap: true,
        }}
      />
    </Box>
  );
};

export default SnapshotMetadataTab;

import { useMemo } from "react";
import { Box } from "@mui/material";

import DynamicField from "src/components/DynamicForm/DynamicField";
import { InstanceSnapshot } from "src/types/instance-snapshot";
import { ServiceOffering } from "src/types/serviceOffering";

type CopySnapshotDialogContentProps = {
  formData: any;
  selectedSnapshot?: InstanceSnapshot;
  serviceOffering?: ServiceOffering;
  isFetchingServiceOfferings?: boolean;
};

const CopySnapshotDialogContent: React.FC<CopySnapshotDialogContentProps> = ({
  formData,
  selectedSnapshot,
  serviceOffering,
  isFetchingServiceOfferings,
}) => {
  const menuItems = useMemo(() => {
    const regions =
      selectedSnapshot?.cloudProvider === "gcp"
        ? serviceOffering?.gcpRegions
        : selectedSnapshot?.cloudProvider === "aws"
          ? serviceOffering?.awsRegions
          : selectedSnapshot?.cloudProvider === "azure"
            ? serviceOffering?.azureRegions
            : [];

    return (
      regions?.map((region) => ({
        label: region,
        value: region,
      })) || []
    );
  }, [selectedSnapshot, serviceOffering]);

  return (
    <Box maxWidth="500px" mx="auto">
      <DynamicField
        field={{
          label: "Target Region",
          placeholder: "Select target region", // TODO: Not showing Placeholder
          name: "copySnapshotRegion",
          type: "select",
          menuItems: menuItems,
          required: true,
          isLoading: isFetchingServiceOfferings,
        }}
        formData={formData}
      />
    </Box>
  );
};

export default CopySnapshotDialogContent;

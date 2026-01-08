import { useMemo } from "react";
import { Box } from "@mui/material";
import { getRegionMenuItems } from "app/(dashboard)/instances/utils";

import DynamicField from "src/components/DynamicForm/DynamicField";
import { CloudProvider } from "src/types/common/enums";
import { ServiceOffering } from "src/types/serviceOffering";

type CopySnapshotDialogContentProps = {
  formData: any;
  serviceOffering?: ServiceOffering;
  isFetchingServiceOfferings?: boolean;
  cloudProvider?: string;
};

const CopySnapshotDialogContent: React.FC<CopySnapshotDialogContentProps> = ({
  formData,
  serviceOffering,
  isFetchingServiceOfferings,
  cloudProvider,
}) => {
  const menuItems = useMemo(
    () => getRegionMenuItems(serviceOffering, cloudProvider as CloudProvider),
    [serviceOffering, cloudProvider]
  );

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

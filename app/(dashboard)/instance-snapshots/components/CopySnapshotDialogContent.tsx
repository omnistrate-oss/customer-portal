import { useEffect, useMemo } from "react";
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
  targetRegion?: string;
};

const CopySnapshotDialogContent: React.FC<CopySnapshotDialogContentProps> = ({
  formData,
  serviceOffering,
  isFetchingServiceOfferings,
  cloudProvider,
  targetRegion,
}) => {
  const menuItems = useMemo(() => {
    const regionMenuItems = getRegionMenuItems(serviceOffering, cloudProvider as CloudProvider);

    if (!targetRegion || regionMenuItems.some((option) => option.value === targetRegion)) {
      return regionMenuItems;
    }

    return [
      {
        label: targetRegion,
        value: targetRegion,
      },
      ...regionMenuItems,
    ];
  }, [serviceOffering, cloudProvider, targetRegion]);

  useEffect(() => {
    if (targetRegion && formData.values.copySnapshotRegion !== targetRegion) {
      formData.setFieldValue("copySnapshotRegion", targetRegion, false);
    }
  }, [formData, targetRegion]);

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
          disabled: Boolean(targetRegion),
          disabledMessage: "OperatorCRD snapshots can only be copied in the same region as the source snapshot",
          isLoading: isFetchingServiceOfferings,
        }}
        formData={formData}
      />
    </Box>
  );
};

export default CopySnapshotDialogContent;

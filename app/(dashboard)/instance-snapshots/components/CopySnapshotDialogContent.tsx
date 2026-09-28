import { useMemo } from "react";
import { Box } from "@mui/material";
import { getRegionMenuItems } from "app/(dashboard)/instances/utils";
import { FormikProps } from "formik";

import DynamicField from "src/components/DynamicForm/DynamicField";
import { CloudProvider } from "src/types/common/enums";
import { ServiceOffering } from "src/types/serviceOffering";

import { SnapshotFormValues } from "../types";

type CopySnapshotDialogContentProps = {
  formData: FormikProps<SnapshotFormValues>;
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

  return (
    <Box maxWidth="500px" mx="auto">
      <DynamicField
        field={{
          label: "Target Region",
          placeholder: "Select target region", // TODO: Not showing Placeholder
          name: "copySnapshotRegion",
          type: "select",
          menuItems: menuItems,
          // A fixed target region is shown in place of the form value; the page submits it too
          value: targetRegion,
          required: true,
          disabled: Boolean(targetRegion),
          disabledMessage: "Snapshots can only be copied in the same region as the source snapshot",
          isLoading: isFetchingServiceOfferings,
        }}
        formData={formData}
      />
    </Box>
  );
};

export default CopySnapshotDialogContent;

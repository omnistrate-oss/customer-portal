import { Box } from "@mui/material";

import DynamicField from "src/components/DynamicForm/DynamicField";
import { ServiceOffering } from "src/types/serviceOffering";

type CopySnapshotDialogContentProps = {
  formData: any;
  serviceOffering?: ServiceOffering;
  isFetchingServiceOfferings?: boolean;
};

const CopySnapshotDialogContent: React.FC<CopySnapshotDialogContentProps> = ({
  formData,
  serviceOffering,
  isFetchingServiceOfferings,
}) => {
  const menuItems = serviceOffering
    ? serviceOffering.gcpRegions?.map((region) => ({
        value: region,
        label: region,
      }))
    : [];

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

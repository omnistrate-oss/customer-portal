import { Box } from "@mui/material";

import DynamicField from "src/components/DynamicForm/DynamicField";
import { CustomNetwork } from "src/types/customNetwork";

type RestoreSnapshotDialogContentProps = {
  customNetworks: CustomNetwork[];
  isFetchingCustomNetworks?: boolean;
  formData: any;
};

const RestoreSnapshotDialogContent: React.FC<RestoreSnapshotDialogContentProps> = ({
  customNetworks,
  isFetchingCustomNetworks,
  formData,
}) => {
  return (
    <Box maxWidth="500px" mx="auto">
      <DynamicField
        field={{
          label: "Custom Network",
          placeholder: "Select custom network", // TODO: Not showing Placeholder
          name: "restoreSnapshotCustomNetworkId",
          type: "select",
          menuItems: customNetworks.map((customNetwork) => {
            return {
              value: customNetwork.id,
              label: customNetwork.id,
            };
          }),
          required: true,
          isLoading: isFetchingCustomNetworks,
        }}
        formData={formData}
      />
    </Box>
  );
};

export default RestoreSnapshotDialogContent;

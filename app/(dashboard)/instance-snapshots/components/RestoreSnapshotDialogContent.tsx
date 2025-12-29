import { Box } from "@mui/material";

import DynamicField from "src/components/DynamicForm/DynamicField";
import { CustomNetwork } from "src/types/customNetwork";
import { InstanceSnapshot } from "src/types/instance-snapshot";

type RestoreSnapshotDialogContentProps = {
  customNetworks: CustomNetwork[];
  selectedSnapshot?: InstanceSnapshot;
  isFetchingCustomNetworks?: boolean;
  formData: any;
};

const RestoreSnapshotDialogContent: React.FC<RestoreSnapshotDialogContentProps> = ({
  customNetworks,
  selectedSnapshot,
  isFetchingCustomNetworks,
  formData,
}) => {
  const { region, cloudProvider } = selectedSnapshot || {};

  return (
    <Box maxWidth="500px" mx="auto">
      <DynamicField
        field={{
          label: "Custom Network",
          placeholder: "Select custom network", // TODO: Not showing Placeholder
          name: "restoreSnapshotCustomNetworkId",
          type: "select",
          menuItems: customNetworks
            .filter((el) => el.cloudProviderName === cloudProvider && el.cloudProviderRegion === region)
            .map((customNetwork) => {
              return {
                value: customNetwork.id,
                label: customNetwork.id,
              };
            }),
          required: true,
          isLoading: isFetchingCustomNetworks,
          emptyMenuText: `No custom networks found for ${cloudProvider} in ${region}`,
        }}
        formData={formData}
      />
    </Box>
  );
};

export default RestoreSnapshotDialogContent;

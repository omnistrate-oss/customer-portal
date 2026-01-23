import { useMemo } from "react";
import { Stack } from "@mui/material";
import { getRegionMenuItems } from "app/(dashboard)/instances/utils";

import DynamicField from "src/components/DynamicForm/DynamicField";
import StatusChip from "src/components/StatusChip/StatusChip";
import { getResourceInstanceStatusStylesAndLabel } from "src/constants/statusChipStyles/resourceInstanceStatus";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { CloudProvider } from "src/types/common/enums";
import { ResourceInstance } from "src/types/resourceInstance";

type CreateSnapshotDialogContentProps = {
  formData: any;
  instances: ResourceInstance[];
  isFetchingInstances?: boolean;
};

const CreateSnapshotDialogContent: React.FC<CreateSnapshotDialogContentProps> = ({
  formData,
  instances,
  isFetchingInstances,
}) => {
  const { subscriptionsObj, serviceOfferingsObj, isFetchingServiceOfferings } = useGlobalData();

  const menuItems = useMemo(() => {
    if (formData.values.createSnapshotInstanceId) {
      const instance = instances.find((inst) => inst.id === formData.values.createSnapshotInstanceId);
      if (instance) {
        const subscription = subscriptionsObj[instance.subscriptionId as string];
        const { serviceId, productTierId } = subscription || {};
        const instanceServiceOffering = serviceOfferingsObj[serviceId as string]?.[productTierId as string];
        const cloudProvider = instance.cloud_provider;

        return getRegionMenuItems(instanceServiceOffering, cloudProvider as CloudProvider);
      }
    }

    return [];
  }, [formData.values.createSnapshotInstanceId, instances, subscriptionsObj, serviceOfferingsObj]);

  return (
    <Stack maxWidth="500px" mx="auto">
      <DynamicField
        field={{
          label: "Instance",
          placeholder: "Select instance", // TODO: Not showing Placeholder
          name: "createSnapshotInstanceId",
          type: "select",
          menuItems: instances.map((instance) => {
            const status = instance.status ?? "";
            const isDisabled = ["DELETING", "DEPLOYING"].includes(status);
            const styles = getResourceInstanceStatusStylesAndLabel(status);
            const data = {
              value: instance.id,
              label: (
                <>
                  {instance.id}
                  {instance.cloud_provider ? " - " + instance.cloud_provider.toUpperCase() : ""}
                  {instance.region ? " - " + instance.region : ""}
                  &nbsp; &nbsp;
                  <StatusChip status={status} {...styles} />
                </>
              ),
              disabled: isDisabled,
              disabledMessage: isDisabled ? "Cannot create snapshot for Deleting or Deploying instances" : "",
            };

            return data;
          }),
          required: true,
          isLoading: isFetchingInstances,
          emptyMenuText: "No instances found",
        }}
        formData={formData}
      />
      <DynamicField
        field={{
          label: "Target Region",
          placeholder: "Select target region", // TODO: Not showing Placeholder
          name: "createSnapshotRegion",
          type: "select",
          menuItems: menuItems,
          required: true,
          isLoading: isFetchingServiceOfferings,
          emptyMenuText: !formData.values.createSnapshotInstanceId
            ? "Please select an instance"
            : "No regions found for selected instance",
        }}
        formData={formData}
      />
    </Stack>
  );
};

export default CreateSnapshotDialogContent;

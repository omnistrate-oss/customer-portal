import { Stack } from "@mui/material";
import { getMainResourceFromInstance, getRegionMenuItems } from "app/(dashboard)/instances/utils";
import { useEffect, useMemo } from "react";

import DynamicField from "src/components/DynamicForm/DynamicField";
import StatusChip from "src/components/StatusChip/StatusChip";
import { getResourceInstanceStatusStylesAndLabel } from "src/constants/statusChipStyles/resourceInstanceStatus";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { CloudProvider } from "src/types/common/enums";
import { ResourceInstance } from "src/types/resourceInstance";

import { isOperatorCRDResourceType } from "../utils";

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

  const selectedInstance = useMemo(() => {
    return instances.find((inst) => inst.id === formData.values.createSnapshotInstanceId);
  }, [formData.values.createSnapshotInstanceId, instances]);

  const selectedInstanceServiceOffering = useMemo(() => {
    if (!selectedInstance) {
      return undefined;
    }

    const subscription = subscriptionsObj[selectedInstance.subscriptionId as string];
    const { serviceId, productTierId } = subscription || {};

    return serviceOfferingsObj[serviceId as string]?.[productTierId as string];
  }, [selectedInstance, serviceOfferingsObj, subscriptionsObj]);

  const selectedInstanceResource = useMemo(() => {
    return getMainResourceFromInstance(selectedInstance, selectedInstanceServiceOffering);
  }, [selectedInstance, selectedInstanceServiceOffering]);

  const targetRegion = isOperatorCRDResourceType(selectedInstanceResource?.resourceType)
    ? selectedInstance?.region
    : undefined;

  const regionMenuItems = useMemo(() => {
    if (formData.values.createSnapshotInstanceId && selectedInstance) {
      return getRegionMenuItems(selectedInstanceServiceOffering, selectedInstance.cloud_provider as CloudProvider);
    }

    return [];
  }, [formData.values.createSnapshotInstanceId, selectedInstance, selectedInstanceServiceOffering]);

  const menuItems = useMemo(() => {
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
  }, [regionMenuItems, targetRegion]);

  useEffect(() => {
    if (targetRegion && formData.values.createSnapshotRegion !== targetRegion) {
      formData.setFieldValue("createSnapshotRegion", targetRegion, false);
      return;
    }

    const currentRegion = formData.values.createSnapshotRegion;
    if (currentRegion && !menuItems.some((item) => item.value === currentRegion)) {
      formData.setFieldValue("createSnapshotRegion", "", false);
    }
  }, [formData, menuItems, targetRegion]);

  const targetRegionDisabledMessage = "Snapshots can only be created in the same region as the selected instance";

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
            const installer = ["UPDATING_INSTALLER", "CREATING_INSTALLER", "INSTALLER_READY"].includes(status);
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
              disabled: isDisabled || installer,
              disabledMessage: installer
                ? "Snapshots are not applicable for air-gapped deployment instances"
                : isDisabled
                  ? "Cannot create snapshot for Deleting or Deploying instances"
                  : "",
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
          disabled: Boolean(targetRegion),
          disabledMessage: targetRegion ? targetRegionDisabledMessage : "",
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

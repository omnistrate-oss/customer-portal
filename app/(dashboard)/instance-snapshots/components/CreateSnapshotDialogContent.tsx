import { useMemo } from "react";
import { SelectChangeEvent, Stack } from "@mui/material";
import { getMainResourceFromInstance, getRegionMenuItems } from "app/(dashboard)/instances/utils";
import { FormikProps } from "formik";

import DynamicField from "src/components/DynamicForm/DynamicField";
import StatusChip from "src/components/StatusChip/StatusChip";
import { getResourceInstanceStatusStylesAndLabel } from "src/constants/statusChipStyles/resourceInstanceStatus";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { CloudProvider } from "src/types/common/enums";
import { ResourceInstance } from "src/types/resourceInstance";
import { ServiceOffering } from "src/types/serviceOffering";
import { Subscription } from "src/types/subscription";

import { SnapshotFormValues } from "../types";
import { isOperatorCRDResourceType } from "../utils";

type CreateSnapshotDialogContentProps = {
  formData: FormikProps<SnapshotFormValues>;
  instances: ResourceInstance[];
  isFetchingInstances?: boolean;
};

const getInstanceServiceOffering = (
  instance: ResourceInstance | undefined,
  subscriptionsObj: Record<string, Subscription>,
  serviceOfferingsObj: Record<string, Record<string, ServiceOffering>>
) => {
  if (!instance) {
    return undefined;
  }

  const subscription = subscriptionsObj[instance.subscriptionId as string];
  const { serviceId, productTierId } = subscription || {};

  return serviceOfferingsObj[serviceId as string]?.[productTierId as string];
};

/** The region an instance's snapshots are pinned to (operator CRD resources), and the regions to offer for it. */
const getRegionOptions = (instance?: ResourceInstance, serviceOffering?: ServiceOffering) => {
  const resource = getMainResourceFromInstance(instance, serviceOffering);
  const targetRegion = isOperatorCRDResourceType(resource?.resourceType) ? instance?.region : undefined;
  const regionMenuItems = instance ? getRegionMenuItems(serviceOffering, instance.cloud_provider as CloudProvider) : [];

  if (!targetRegion || regionMenuItems.some((option) => option.value === targetRegion)) {
    return { targetRegion, menuItems: regionMenuItems };
  }

  return { targetRegion, menuItems: [{ label: targetRegion, value: targetRegion }, ...regionMenuItems] };
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

  const { targetRegion, menuItems } = useMemo(
    () =>
      getRegionOptions(
        selectedInstance,
        getInstanceServiceOffering(selectedInstance, subscriptionsObj, serviceOfferingsObj)
      ),
    [selectedInstance, serviceOfferingsObj, subscriptionsObj]
  );

  // Picking an instance sets the region it is pinned to, or clears a region it doesn't offer
  const handleInstanceChange = (event: SelectChangeEvent<string>) => {
    const instance = instances.find((inst) => inst.id === event.target.value);
    const next = getRegionOptions(
      instance,
      getInstanceServiceOffering(instance, subscriptionsObj, serviceOfferingsObj)
    );
    const currentRegion = formData.values.createSnapshotRegion;

    if (next.targetRegion) {
      formData.setFieldValue("createSnapshotRegion", next.targetRegion, false);
    } else if (currentRegion && !next.menuItems.some((item) => item.value === currentRegion)) {
      formData.setFieldValue("createSnapshotRegion", "", false);
    }
  };

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
            const isDisabled = !["RUNNING", "READY"].includes(status);
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
                  ? "Snapshots can only be created for running or ready instances"
                  : "",
            };

            return data;
          }),
          onChange: handleInstanceChange,
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
          // A pinned region is shown even before the form holds it; the page submits it too
          value: targetRegion,
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

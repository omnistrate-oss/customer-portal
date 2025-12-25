import { useMemo } from "react";
import { Stack } from "@mui/material";

import DynamicField from "src/components/DynamicForm/DynamicField";
import { useGlobalData } from "src/providers/GlobalDataProvider";
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

        // NOTE: Instance Snapshots are only supported for GCP instances for now
        return (
          instanceServiceOffering?.gcpRegions?.map((region) => ({
            value: region,
            label: region,
          })) || []
        );
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
          menuItems: instances
            .filter((instance) => instance.cloud_provider === "gcp")
            .map((instance) => ({
              value: instance.id,
              label: instance.id,
            })),
          required: true,
          isLoading: isFetchingInstances,
          emptyMenuText: "No GCP instances found",
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

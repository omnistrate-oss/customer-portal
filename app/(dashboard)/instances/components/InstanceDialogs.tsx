import { useMemo } from "react";

import { $api } from "src/api/query";
import GenerateTokenDialog from "src/components/GenerateToken/GenerateTokenDialog";
import AccessSideRestoreInstance from "src/components/RestoreInstance/AccessSideRestoreInstance";
import TextConfirmationDialog from "src/components/TextConfirmationDialog/TextConfirmationDialog";
import UpgradeDialog from "src/components/Upgrade/UpgradeDialog";
import { ResourceInstance } from "src/hooks/useResourceInstance";
import useSnackbar from "src/hooks/useSnackbar";
import { SetState } from "src/types/common/reactGenerics";
import { ServiceOffering } from "src/types/serviceOffering";
import { Subscription } from "src/types/subscription";

import { Overlay } from "../page";
import { getMainResourceFromInstance } from "../utils";

type InstanceDialogsProps = {
  isOverlayOpen: boolean;
  setIsOverlayOpen: SetState<boolean>;
  overlayType: Overlay;
  serviceOffering?: ServiceOffering;
  subscription?: Subscription;
  instance?: ResourceInstance;

  selectedRows?: string[];
  setSelectedRows?: SetState<string[]>;
  refetchData: () => void;
};

const InstanceDialogs: React.FC<InstanceDialogsProps> = ({
  isOverlayOpen,
  setIsOverlayOpen,
  overlayType,
  serviceOffering,
  instance,
  subscription,

  setSelectedRows = () => {},
  refetchData,
}) => {
  const snackbar = useSnackbar();
  console.log(instance);

  // Resource of the Selected Instance
  const selectedResource = useMemo(() => {
    return getMainResourceFromInstance(instance, serviceOffering);
  }, [instance, serviceOffering]);

  const selectedInstanceData = useMemo(() => {
    return {
      id: instance?.id || "",
      serviceProviderId: serviceOffering?.serviceProviderId || "",
      serviceKey: serviceOffering?.serviceURLKey || "",
      serviceAPIVersion: serviceOffering?.serviceAPIVersion || "",
      serviceEnvironmentKey: serviceOffering?.serviceEnvironmentURLKey || "",
      serviceModelKey: serviceOffering?.serviceModelURLKey || "",
      productTierKey: serviceOffering?.productTierURLKey || "",
      resourceKey: selectedResource?.urlKey as string,
      subscriptionId: subscription?.id,
    };
  }, [instance, serviceOffering, subscription, selectedResource]);

  const deleteInstanceMutation = $api.useMutation(
    "delete",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}",
    {
      onSuccess: () => {
        setSelectedRows([]);
        refetchData();
        setIsOverlayOpen(false);
        snackbar.showSuccess("Deleting deployment instance...");
      },
    }
  );

  return (
    <>
      <UpgradeDialog
        open={isOverlayOpen && overlayType === "upgrade-dialog"}
        onClose={() => setIsOverlayOpen(false)}
        refetchInstances={refetchData}
        instance={instance}
        subscription={subscription}
        serviceOffering={serviceOffering}
      />

      <TextConfirmationDialog
        open={isOverlayOpen && overlayType === "delete-dialog"}
        handleClose={() => setIsOverlayOpen(false)}
        onConfirm={async () => {
          if (!instance) return snackbar.showError("No instance selected");
          if (!serviceOffering) {
            return snackbar.showError("Offering not found");
          }
          if (!subscription) {
            return snackbar.showError("Subscription not found");
          }
          if (!selectedResource) {
            return snackbar.showError("Resource not found");
          }
          await deleteInstanceMutation.mutateAsync({
            params: {
              path: {
                serviceProviderId: selectedInstanceData.serviceProviderId,
                serviceKey: selectedInstanceData.serviceKey,
                serviceAPIVersion: selectedInstanceData.serviceAPIVersion,
                serviceEnvironmentKey: selectedInstanceData.serviceEnvironmentKey,
                serviceModelKey: selectedInstanceData.serviceModelKey,
                productTierKey: selectedInstanceData.productTierKey,
                resourceKey: selectedInstanceData.resourceKey,
                id: selectedInstanceData.id,
              },
              query: {
                subscriptionId: subscription.id,
              },
            },
          });
        }}
        title="Delete Instance"
        subtitle={`Are you sure you want to delete - ${selectedInstanceData?.id}?`}
        message="To confirm, please enter <b>deleteme</b>, in the field below:"
        isLoading={deleteInstanceMutation.isPending}
      />

      <GenerateTokenDialog
        dashboardEndpoint={instance?.kubernetesDashboardEndpoint?.dashboardEndpoint}
        open={isOverlayOpen && overlayType === "generate-token-dialog"}
        onClose={() => setIsOverlayOpen(false)}
        selectedInstanceId={instance?.id}
        subscriptionId={instance?.subscriptionId}
      />

      <AccessSideRestoreInstance
        open={isOverlayOpen && overlayType === "restore-dialog"}
        handleClose={() => setIsOverlayOpen(false)}
        earliestRestoreTime={(instance?.backupStatus as any)?.earliestRestoreTime}
        service={serviceOffering}
        setSelectionModel={setSelectedRows}
        fetchResourceInstances={refetchData}
        selectedResource={selectedResource}
        subscriptionId={subscription?.id}
        selectedInstanceId={instance?.id}
        networkType={instance?.network_type}
      />
    </>
  );
};

export default InstanceDialogs;

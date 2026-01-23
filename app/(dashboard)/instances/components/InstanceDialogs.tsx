import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@mui/material";
import FullScreenDrawer from "app/(dashboard)/components/FullScreenDrawer/FullScreenDrawer";

import { $api } from "src/api/query";
import GenerateTokenDialog from "src/components/GenerateToken/GenerateTokenDialog";
import DeleteCircleIcon from "src/components/Icons/DeleteCircle/DeleteCircleIcon";
import LockIcon from "src/components/Icons/Lock/LockIcon";
import RebootCircleIcon from "src/components/Icons/Reboot/RebootCircleIcon";
import StopCircleIcon from "src/components/Icons/Stop/StopCircleIcon";
import UnlockIcon from "src/components/Icons/Unlock/UnlockIcon";
import OverlappingCirclesIconWrapper from "src/components/OverlappingCirclesIconWrapper/OverlappingCirclesIconWrapper";
import CreateInstanceModal from "src/components/ResourceInstance/CreateInstanceModal/CreateInstanceModal";
import AccessSideRestoreInstance from "src/components/RestoreInstance/AccessSideRestoreInstance";
import TextConfirmationDialog from "src/components/TextConfirmationDialog/TextConfirmationDialog";
import UpgradeDialog from "src/components/Upgrade/UpgradeDialog";
import useSnackbar from "src/hooks/useSnackbar";
import { colors } from "src/themeConfig";
import { SetState } from "src/types/common/reactGenerics";
import { ResourceInstance as DescribeResourceInstanceResponse } from "src/types/resourceInstance";
import { ServiceOffering } from "src/types/serviceOffering";
import { Subscription } from "src/types/subscription";
import { getInstancesRoute } from "src/utils/routes";

import { Overlay } from "../page";
import { getMainResourceFromInstance } from "../utils";

import InstanceForm from "./InstanceForm";
import SnapshotBeforeDeletionConfirmation from "./SnapshotBeforeDeletionConfirmation";

type InstanceDialogsProps = {
  variant: "instances-page" | "details-page";
  isOverlayOpen: boolean;
  setIsOverlayOpen: SetState<boolean>;
  overlayType: Overlay;
  setOverlayType: SetState<Overlay>;
  serviceOffering?: ServiceOffering;
  subscription?: Subscription;
  instance?: DescribeResourceInstanceResponse;
  instances: DescribeResourceInstanceResponse[];

  selectedRows?: string[];
  setSelectedRows?: SetState<string[]>;
  refetchData: () => void;
};

const DIALOG_DATA = {
  "delete-dialog": {
    icon: DeleteCircleIcon,
    title: "Delete Instance",
    subtitle: "Are you sure you want to delete",
    confirmationText: "deleteme",
    buttonLabel: "Delete",
    buttonColor: "#D92D20",
  },
  "reboot-dialog": {
    icon: RebootCircleIcon,
    title: "Reboot Instance",
    subtitle: "Are you sure you want to reboot",
    confirmationText: "reboot",
    buttonLabel: "Reboot",
    buttonColor: colors.success600,
  },
  "stop-dialog": {
    icon: StopCircleIcon,
    title: "Stop Instance",
    subtitle: "Are you sure you want to stop",
    confirmationText: "stop",
    buttonLabel: "Stop",
    buttonColor: "#D92D20",
  },
  "enable-deletion-protection-dialog": {
    icon: () => <OverlappingCirclesIconWrapper IconComponent={LockIcon} />,
    title: "Enable Delete Protection",
    subtitle: "Are you sure you want to enable delete protection for",
    confirmationText: "enable",
    buttonLabel: "Enable",
    buttonColor: colors.success600,
  },
  "disable-deletion-protection-dialog": {
    icon: () => <OverlappingCirclesIconWrapper IconComponent={UnlockIcon} />,
    title: "Disable Delete Protection",
    subtitle: "Are you sure you want to disable delete protection for",
    confirmationText: "disable",
    buttonLabel: "Disable",
    buttonColor: colors.success600,
  },
};

const InstanceDialogs: React.FC<InstanceDialogsProps> = ({
  variant,
  isOverlayOpen,
  setIsOverlayOpen,
  overlayType,
  setOverlayType,
  serviceOffering,
  instance,
  instances,
  subscription,

  setSelectedRows = () => {},
  refetchData,
}) => {
  const router = useRouter();
  const [createInstanceModalData, setCreateInstanceModalData] = useState<{
    instanceId?: string;
    isCustomDNS?: boolean;
  }>({});
  const [takeFinalSnapshot, setTakeFinalSnapshot] = useState(true);
  const showSnapshotBeforeDeleteOption = Boolean(instance?.snapshotBeforeDeletionEnabled);
  const snackbar = useSnackbar();

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
        setTakeFinalSnapshot(true);

        snackbar.showSuccess("Deleting deployment instance...");

        if (variant === "details-page") {
          router.replace(getInstancesRoute());
        }
      },
    }
  );

  const stopInstanceMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}/stop",
    {
      onSuccess: async () => {
        refetchData();
        setSelectedRows([]);
        snackbar.showSuccess("Stopping deployment instance...");
      },
    }
  );

  const restartInstanceMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}/restart",
    {
      onSuccess: async () => {
        refetchData();
        setSelectedRows([]);
        snackbar.showSuccess("Restarting deployment instance...");
      },
    }
  );

  const updateInstanceMetadataMutation = $api.useMutation(
    "patch",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}/metadata",
    {
      onSuccess: async () => {
        refetchData();
        setSelectedRows([]);
        if (overlayType === "enable-deletion-protection-dialog") {
          snackbar.showSuccess("Delete protection enabled successfully");
        } else {
          snackbar.showSuccess("Delete protection disabled successfully");
        }
      },
    }
  );

  return (
    <>
      <CreateInstanceModal
        open={isOverlayOpen && overlayType === "create-instance-dialog"}
        handleClose={() => setIsOverlayOpen(false)}
        data={createInstanceModalData}
      />

      <FullScreenDrawer
        title={overlayType === "create-instance-form" ? "Create Deployment Instance" : "Modify Deployment Instance"}
        description={
          overlayType === "create-instance-form" ? "Create new Deployment Instance" : "Modify Deployment Instance"
        }
        open={isOverlayOpen && ["create-instance-form", "modify-instance-form"].includes(overlayType)}
        closeDrawer={() => setIsOverlayOpen(false)}
        RenderUI={
          <InstanceForm
            instances={instances}
            formMode={overlayType === "create-instance-form" ? "create" : "modify"}
            selectedInstance={instance}
            refetchInstances={refetchData}
            setCreateInstanceModalData={setCreateInstanceModalData}
            setIsOverlayOpen={setIsOverlayOpen}
            setOverlayType={setOverlayType}
          />
        }
      />

      <UpgradeDialog
        open={isOverlayOpen && overlayType === "upgrade-dialog"}
        onClose={() => setIsOverlayOpen(false)}
        refetchInstances={refetchData}
        instance={instance}
        subscription={subscription}
        serviceOffering={serviceOffering}
      />

      <TextConfirmationDialog
        maxWidth={overlayType === "delete-dialog" && showSnapshotBeforeDeleteOption ? "595px" : "521px"}
        open={isOverlayOpen && Object.keys(DIALOG_DATA).includes(overlayType)}
        handleClose={() => setIsOverlayOpen(false)}
        onConfirm={async () => {
          if (!instance) snackbar.showError("No instance selected");
          if (!serviceOffering) {
            snackbar.showError("Offering not found");
          }
          if (!subscription) {
            snackbar.showError("Subscription not found");
          }
          if (!selectedResource) {
            snackbar.showError("Resource not found");
          }
          if (!instance || !serviceOffering || !subscription || !selectedResource) return false;

          const pathData = {
            serviceProviderId: selectedInstanceData.serviceProviderId,
            serviceKey: selectedInstanceData.serviceKey,
            serviceAPIVersion: selectedInstanceData.serviceAPIVersion,
            serviceEnvironmentKey: selectedInstanceData.serviceEnvironmentKey,
            serviceModelKey: selectedInstanceData.serviceModelKey,
            productTierKey: selectedInstanceData.productTierKey,
            resourceKey: selectedInstanceData.resourceKey,
            id: selectedInstanceData.id,
          };

          const body = {
            params: {
              path: pathData,
              query: {
                subscriptionId: subscription.id,
                skipFinalSnapshot:
                  overlayType === "delete-dialog" && showSnapshotBeforeDeleteOption ? !takeFinalSnapshot : undefined,
              },
            },
          };

          if (overlayType === "delete-dialog") {
            await deleteInstanceMutation.mutateAsync(body);
          } else if (overlayType === "reboot-dialog") {
            await restartInstanceMutation.mutateAsync(body);
          } else if (
            overlayType === "enable-deletion-protection-dialog" ||
            overlayType === "disable-deletion-protection-dialog"
          ) {
            await updateInstanceMetadataMutation.mutateAsync({
              ...body,
              body: {
                deletionProtection: overlayType === "enable-deletion-protection-dialog" ? true : false,
              },
            });
          } else {
            await stopInstanceMutation.mutateAsync(body);
          }

          return true;
        }}
        IconComponent={DIALOG_DATA[overlayType]?.icon}
        title={DIALOG_DATA[overlayType]?.title}
        subtitle={
          <>
            {`${DIALOG_DATA[overlayType]?.subtitle} - ${selectedInstanceData?.id}?`}
            {overlayType === "delete-dialog" && showSnapshotBeforeDeleteOption && (
              <Box marginTop="16px">
                <SnapshotBeforeDeletionConfirmation
                  takeFinalSnapshot={takeFinalSnapshot}
                  setTakeFinalSnapshot={setTakeFinalSnapshot}
                />
              </Box>
            )}
          </>
        }
        confirmationText={DIALOG_DATA[overlayType]?.confirmationText}
        buttonLabel={DIALOG_DATA[overlayType]?.buttonLabel}
        buttonColor={DIALOG_DATA[overlayType]?.buttonColor}
        isLoading={
          deleteInstanceMutation.isPending ||
          stopInstanceMutation.isPending ||
          restartInstanceMutation.isPending ||
          updateInstanceMetadataMutation.isPending
        }
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

import { useMemo, useState } from "react";
import { Box, Stack } from "@mui/material";
import useCustomerVersionSets from "app/(dashboard)/instances/hooks/useCustomerVersionSets";
import { DeploymentInstance } from "app/(dashboard)/instances/hooks/useInstances";

import { $api } from "src/api/query";
import useSnackbar from "src/hooks/useSnackbar";
import { ServiceOffering } from "src/types/serviceOffering";
import { Subscription } from "src/types/subscription";

import LoadingSpinnerSmall from "../CircularProgress/CircularProgress";
import ConfirmationDialog from "../Dialog/ConfirmationDialog";
import FieldLabel from "../FormElements/FieldLabel/FieldLabel";
import MenuItem from "../FormElementsv2/MenuItem/MenuItem";
import Select from "../FormElementsv2/Select/Select";
import TextField from "../FormElementsv2/TextField/TextField";
import UpgradeDialogIcon from "../Icons/Upgrade/UpgradeDialogIcon";
import StatusChip from "../StatusChip/StatusChip";
import Tooltip from "../Tooltip/Tooltip";
import { Text } from "../Typography/Typography";

type UpgradeDialogProps = {
  open: boolean;
  onClose: () => void;
  refetchInstances: () => void;
  selectedInstance?: DeploymentInstance;
  selectedInstanceSubscription?: Subscription;
  selectedInstanceOffering?: ServiceOffering;
};

const UpgradeDialog: React.FC<UpgradeDialogProps> = ({
  open,
  onClose,
  refetchInstances,
  selectedInstance,
  selectedInstanceSubscription,
  selectedInstanceOffering,
}) => {
  const snackbar = useSnackbar();
  const [selectedVersion, setSelectedVersion] = useState<string>("");

  const upgradeInstanceMutation = $api.useMutation("post", "/2022-09-01-00/resource-instance/{id}/version-upgrade", {
    onSuccess: () => {
      snackbar.showSuccess("Instance upgrade initiated successfully");
      refetchInstances();
    },
  });

  const { data: versionSets = [], isFetching: isFetchingAvailableVersions } = useCustomerVersionSets(
    {
      serviceId: selectedInstanceSubscription?.serviceId,
      productTierId: selectedInstanceSubscription?.productTierId,
    },
    {
      enabled: !!selectedInstanceSubscription?.serviceId && !!selectedInstanceSubscription?.productTierId && open,
    }
  );

  const versionMenuItems = useMemo(() => {
    return versionSets.map((versionSet) => {
      const isPreferred = versionSet.status === "Preferred";
      const isCurrentVersion = versionSet.version === selectedInstance?.tierVersion;

      return {
        label: isCurrentVersion ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{versionSet.version}</span>
            <StatusChip status="Current Version" category="info" />
          </div>
        ) : isPreferred ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{versionSet.version}</span>
            <StatusChip status="Default" category="success" />
          </div>
        ) : (
          versionSet.version
        ),
        value: versionSet.version,
        disabled: isCurrentVersion,
        disabledMessage: isCurrentVersion ? "Cannot select the current version for upgrade" : "",
      };
    });
  }, [versionSets, selectedInstance?.tierVersion]);

  console.log("Version Menu Items:", selectedInstanceOffering);

  const Content = () => {
    if (isFetchingAvailableVersions) {
      return (
        <Box height="110px" display="flex" alignItems="center" justifyContent="center">
          <LoadingSpinnerSmall />
        </Box>
      );
    }

    return (
      <>
        <Text size="small" weight="medium" color="#414651" sx={{ mb: "20px" }}>
          Do you want to upgrade the version?
        </Text>

        <Stack direction="row" gap="24px" alignItems="center">
          <Box flex="1">
            <FieldLabel>Version from</FieldLabel>
            <TextField disabled value={selectedInstance?.tierVersion || "1.0"} />
          </Box>

          <Box flex="1">
            <FieldLabel required>Version to</FieldLabel>
            <Select value={selectedVersion} onChange={(e) => setSelectedVersion(e.target.value)}>
              {versionMenuItems?.length > 0 ? (
                versionMenuItems.map((option) => {
                  const menuItem = (
                    <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
                      {option.label}
                    </MenuItem>
                  );

                  if (option.disabled && option.disabledMessage) {
                    return (
                      <Tooltip title={option.disabledMessage} key={option.value} placement="top" arrow>
                        <span>{menuItem}</span>
                      </Tooltip>
                    );
                  }

                  return menuItem;
                })
              ) : (
                <MenuItem value="" disabled>
                  <i>No versions found</i>
                </MenuItem>
              )}
            </Select>
          </Box>
        </Stack>
      </>
    );
  };

  return (
    <ConfirmationDialog
      icon={UpgradeDialogIcon}
      title="Version Upgrade"
      content={Content}
      onClose={onClose}
      open={open}
      confirmButtonLabel="Upgrade"
      isLoading={upgradeInstanceMutation.isPending}
      onConfirm={async () => {
        if (!selectedInstance?.id) {
          snackbar.showError("Please select an instance to upgrade");
          return;
        }

        const resource = selectedInstanceOffering?.resourceParameters.find(
          (resource) => resource.resourceId === selectedInstance?.resourceID
        );

        await upgradeInstanceMutation.mutateAsync({
          params: {
            path: {
              id: selectedInstance.id,
            },
            query: {
              subscriptionId: selectedInstance.subscriptionId,
            },
          },
          body: {
            productTierKey: selectedInstanceOffering?.productTierURLKey || "",
            resourceKey: resource?.urlKey || "",
            serviceAPIVersion: selectedInstanceOffering?.serviceAPIVersion || "",
            serviceEnvironmentKey: selectedInstanceOffering?.serviceEnvironmentURLKey || "",
            serviceKey: selectedInstanceOffering?.serviceURLKey || "",
            serviceModelKey: selectedInstanceOffering?.serviceModelURLKey || "",
            serviceProviderId: selectedInstanceOffering?.serviceProviderId || "",
            targetVersion: selectedVersion,
          },
        });
      }}
    />
  );
};

export default UpgradeDialog;

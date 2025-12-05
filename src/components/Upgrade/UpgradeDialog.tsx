import { useMemo, useState } from "react";
import { Box, Stack } from "@mui/material";
import useCustomerVersionSets from "app/(dashboard)/instances/hooks/useCustomerVersionSets";

import { $api } from "src/api/query";
import useSnackbar from "src/hooks/useSnackbar";
import { ResourceInstance } from "src/types/resourceInstance";
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
  instance?: ResourceInstance;
  subscription?: Subscription;
  serviceOffering?: ServiceOffering;
};

const UpgradeDialog: React.FC<UpgradeDialogProps> = ({
  open,
  onClose,
  refetchInstances,
  instance,
  subscription,
  serviceOffering,
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
      serviceId: subscription?.serviceId,
      productTierId: subscription?.productTierId,
    },
    {
      enabled: !!subscription?.serviceId && !!subscription?.productTierId && open,
    }
  );

  const versionMenuItems = useMemo(() => {
    return versionSets.map((versionSet) => {
      const isPreferred = versionSet.status === "Preferred";
      const isCurrentVersion = versionSet.version === instance?.tierVersion;

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
  }, [versionSets, instance?.tierVersion]);

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
            <TextField disabled value={instance?.tierVersion || "1.0"} />
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
                      <Tooltip title={option.disabledMessage} key={option.value}>
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
        if (!instance?.id) {
          snackbar.showError("Please select an instance to upgrade");
          return false;
        }

        const resource = serviceOffering?.resourceParameters.find(
          (resource) => resource.resourceId === instance?.resourceID
        );

        if (!selectedVersion) {
          snackbar.showError("Please select a version to upgrade");
          return false;
        }

        await upgradeInstanceMutation.mutateAsync({
          params: {
            path: {
              id: instance.id,
            },
            query: {
              subscriptionId: instance.subscriptionId,
            },
          },
          body: {
            productTierKey: serviceOffering?.productTierURLKey || "",
            resourceKey: resource?.urlKey || "",
            serviceAPIVersion: serviceOffering?.serviceAPIVersion || "",
            serviceEnvironmentKey: serviceOffering?.serviceEnvironmentURLKey || "",
            serviceKey: serviceOffering?.serviceURLKey || "",
            serviceModelKey: serviceOffering?.serviceModelURLKey || "",
            serviceProviderId: serviceOffering?.serviceProviderId || "",
            targetVersion: selectedVersion,
          },
        });

        return true;
      }}
    />
  );
};

export default UpgradeDialog;

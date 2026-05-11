"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Stack } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";

import { $api } from "src/api/query";
import { deleteResourceInstance, getResourceInstanceDetails } from "src/api/resourceInstance";
import ConnectAccountConfigDialog from "src/components/AccountConfigDialog/ConnectAccountConfigDialog";
import DisconnectAccountConfigDialog from "src/components/AccountConfigDialog/DisconnectAccountConfigDialog";
import DeleteProtectionIcon from "src/components/Icons/DeleteProtection/DeleteProtection";
import TextConfirmationDialog from "src/components/TextConfirmationDialog/TextConfirmationDialog";
import { cloudProviderLongLogoMap } from "src/constants/cloudProviders";
import { chipCategoryColors } from "src/constants/statusChipStyles";
import { getResourceInstanceStatusStylesAndLabel } from "src/constants/statusChipStyles/resourceInstanceStatus";
import useAccountConfigsByIds from "src/hooks/query/useAccountConfigByIds";
import useSnackbar from "src/hooks/useSnackbar";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { AccountConfig } from "src/types/account-config";
import { CloudProvider } from "src/types/common/enums";
import { ResourceInstance } from "src/types/resourceInstance";
import { isCloudAccountInstance } from "src/utils/access/byoaResource";
import {
  getAzureBootstrapShellCommand,
  getAzureShellScriptOffboardCommand,
  getGcpBootstrapShellCommand,
  getGcpShellScriptOffboardCommand,
  getOciShellScriptOffboardCommand,
} from "src/utils/accountConfig/accountConfig";
import formatDateUTC from "src/utils/formatDateUTC";
import { getResultParams } from "src/utils/instance";
import { getCloudAccountsRoute } from "src/utils/routes";
import CloudProviderAccountOrgIdModal from "components/CloudProviderAccountOrgIdModal/CloudProviderAccountOrgIdModal";
import DataTable from "components/DataTable/DataTable";
import GridCellExpand from "components/GridCellExpand/GridCellExpand";
import ViewInstructionsIcon from "components/Icons/AccountConfig/ViewInstrcutionsIcon";
import ServiceNameWithLogo from "components/ServiceNameWithLogo/ServiceNameWithLogo";
import StatusChip from "components/StatusChip/StatusChip";
import Tooltip from "components/Tooltip/Tooltip";

import FullScreenDrawer from "../components/FullScreenDrawer/FullScreenDrawer";
import CloudAccountsIcon from "../components/Icons/CloudAccountsIcon";
import PageContainer from "../components/Layout/PageContainer";
import PageTitle from "../components/Layout/PageTitle";
import useInstancesDescribe from "../instances/hooks/useInstancesDescribe";
import useInstancesListWithDescribe from "../instances/hooks/useInstancesListWithDescribe";

import CloudAccountForm from "./components/CloudAccountForm";
import CloudAccountsTableHeader from "./components/CloudAccountsTableHeader";
import DeleteAccountConfigConfirmationDialog from "./components/DeleteConfirmationDialog";
import {
  INSTANCE_STATUS_POLL_INTERVAL_MS,
  MAX_POLL_COUNT,
  shouldPollInstanceStatus,
  shouldResetDeleteMutationOnClose,
} from "./components/deleteDialogState";
import { OffboardInstructionDetails } from "./components/OffboardingInstructions";
import useAccountConfig from "./hooks/useAccountConfig";
import { DIALOG_DATA } from "./constants";
import { getOffboardReadiness, InitialFormValuesFromUrl } from "./utils";

const columnHelper = createColumnHelper<ResourceInstance>();

export type Overlay =
  | "delete-dialog"
  | "create-instance-form"
  | "view-instance-form"
  | "modify-instance-form"
  | "view-instructions-dialog"
  | "connect-dialog"
  | "disconnect-dialog"
  | "offboard-dialog"
  | "enable-deletion-protection-dialog"
  | "disable-deletion-protection-dialog";

const CloudAccountsPage = () => {
  const snackbar = useSnackbar();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams?.get("serviceId");
  const servicePlanId = searchParams?.get("servicePlanId");
  const subscriptionId = searchParams?.get("subscriptionId");

  const { subscriptionsObj, serviceOfferingsObj } = useGlobalData();
  const [initialFormValues, setInitialFormValues] = useState<InitialFormValuesFromUrl | undefined>();
  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [overlayType, setOverlayType] = useState<Overlay>("create-instance-form");
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isAccountCreation, setIsAccountCreation] = useState(false);
  const [clickedInstance, setClickedInstance] = useState<ResourceInstance>();
  const [hasRequestedDeleteForPolling, setHasRequestedDeleteForPolling] = useState(false);

  const awsCloudFormationTemplateUrl = useMemo(() => {
    const resultParams = getResultParams(clickedInstance);
    return resultParams?.cloudformation_url;
  }, [clickedInstance]);

  const gcpBootstrapShellCommand = useMemo(() => {
    const resultParams = getResultParams(clickedInstance);
    if (resultParams?.gcp_bootstrap_shell_script) {
      return resultParams?.gcp_bootstrap_shell_script;
    } else if (resultParams?.cloud_provider_account_config_id) {
      return getGcpBootstrapShellCommand(resultParams?.cloud_provider_account_config_id);
    }
  }, [clickedInstance]);

  const azureBootstrapShellCommand = useMemo(() => {
    const resultParams = getResultParams(clickedInstance);
    if (resultParams?.azure_bootstrap_shell_script) {
      return resultParams?.azure_bootstrap_shell_script;
    } else if (resultParams?.cloud_provider_account_config_id) {
      return getAzureBootstrapShellCommand(resultParams?.cloud_provider_account_config_id);
    }
  }, [clickedInstance]);

  const accountInstructionDetails = useMemo(() => {
    const resultParams = getResultParams(clickedInstance);
    let details = {};
    if (resultParams?.aws_account_id) {
      details = {
        awsAccountID: resultParams?.aws_account_id,
      };
    } else if (resultParams?.gcp_project_id) {
      details = {
        gcpProjectID: resultParams?.gcp_project_id,
        gcpProjectNumber: resultParams?.gcp_project_number,
      };
    } else if (resultParams?.azure_subscription_id) {
      details = {
        azureSubscriptionID: resultParams?.azure_subscription_id,
        azureTenantID: resultParams?.azure_tenant_id,
      };
    } else if (resultParams?.oci_tenancy_id) {
      details = {
        ociTenancyID: resultParams?.oci_tenancy_id,
        ociDomainID: resultParams?.oci_domain_id,
        ociBootstrapShellCommand: resultParams?.oci_bootstrap_shell_script,
      };
    }
    return details;
  }, [clickedInstance]);

  const {
    data: instances = [],
    isPending: isInstancesPending,
    isFetching: isFetchingInstances,
    refetch: refetchInstances,
  } = useInstancesListWithDescribe({ describeInstances: true, onlyCloudAccounts: true });

  const accountConfigIds = useMemo(() => {
    const ids = new Set<string>();
    instances.forEach((instance) => {
      const resultParams = getResultParams(instance);
      if (resultParams?.cloud_provider_account_config_id) {
        ids.add(resultParams.cloud_provider_account_config_id);
      }
    });
    return Array.from(ids);
  }, [instances]);

  const {
    data: accountConfigsHash,
    isPending: isAccountConfigsPending,
    isFetching: isFetchingAccountConfigs,
    refetch: refetchAccountConfigs,
  } = useAccountConfigsByIds(accountConfigIds);

  // Open the Create Form Overlay when serviceId, servicePlanId and subscriptionId are present in the URL
  useEffect(() => {
    if (serviceId && servicePlanId && subscriptionId) {
      setOverlayType("create-instance-form");
      setIsOverlayOpen(true);
      setInitialFormValues({
        serviceId,
        servicePlanId,
        subscriptionId,
      });
      router.replace(getCloudAccountsRoute({}));
    }
  }, [serviceId, servicePlanId, subscriptionId]);

  const byoaInstances = useMemo(() => {
    const res = instances.filter((instance) => isCloudAccountInstance(instance));

    if (searchText) {
      return res.filter((instance) => {
        const resultParams = getResultParams(instance);
        return (
          resultParams?.gcp_project_id?.toLowerCase().includes(searchText.toLowerCase()) ||
          resultParams?.aws_account_id?.toLowerCase().includes(searchText.toLowerCase()) ||
          resultParams?.azure_subscription_id?.toLowerCase().includes(searchText.toLowerCase()) ||
          resultParams?.oci_tenancy_id?.toLowerCase().includes(searchText.toLowerCase()) ||
          resultParams?.nebius_tenant_id?.toLowerCase().includes(searchText.toLowerCase())
        );
      });
    }

    return res;
  }, [instances, searchText]);

  const dataTableColumns = useMemo(() => {
    return [
      columnHelper.display({
        id: "delete_protection",
        header: "",
        cell: (data) => {
          const isDeleteProtectionSupported =
            data.row.original.resourceInstanceMetadata?.deletionProtection !== undefined;
          const isDeleteProtected = data.row.original?.resourceInstanceMetadata?.deletionProtection;

          return (
            <Tooltip
              title={
                !isDeleteProtectionSupported
                  ? "Delete protection not supported"
                  : isDeleteProtected
                    ? "Delete protection enabled"
                    : "Delete protection disabled"
              }
            >
              <span>
                <DeleteProtectionIcon disabled={!isDeleteProtected} />
              </span>
            </Tooltip>
          );
        },
        meta: {
          width: 25,
          minWidth: 25,
          headerStyles: {
            paddingLeft: "8px",
            paddingRight: "4px",
          },
          styles: {
            paddingLeft: "8px",
            paddingRight: "4px",
          },
        },
      }),
      columnHelper.accessor(
        (row) => {
          const resultParams = getResultParams(row);
          return (
            resultParams?.gcp_project_id ||
            resultParams?.aws_account_id ||
            resultParams?.azure_subscription_id ||
            resultParams?.oci_tenancy_id ||
            resultParams?.nebius_tenant_id ||
            "-"
          );
        },
        {
          id: "account_id",
          header: "Account ID / Project ID",
          cell: (data) => {
            const resultParams = getResultParams(data.row.original);
            const value =
              resultParams?.gcp_project_id ||
              resultParams?.aws_account_id ||
              resultParams?.azure_subscription_id ||
              resultParams?.oci_tenancy_id ||
              resultParams?.nebius_tenant_id ||
              "-";

            return <GridCellExpand value={value} copyButton={value !== "-"} />;
          },
          meta: {
            minWidth: 200,
          },
        }
      ),
      columnHelper.accessor("status", {
        id: "status",
        header: "Lifecycle Status",
        cell: (data) => {
          const status = data.row.original.status;
          let statusStylesAndLabel = getResourceInstanceStatusStylesAndLabel(status as string);
          const resultParams = getResultParams(data.row.original);
          const isNebius = !!resultParams?.nebius_tenant_id;

          const showInstructions =
            !isNebius &&
            ["VERIFYING", "PENDING", "PENDING_DEPENDENCY", "UNKNOWN", "DEPLOYING", "READY", "FAILED"].includes(
              status as string
            );

          let isReadyToOffboard = false;
          let isOffboarding = false;

          const linkedAccountConfig = accountConfigsHash[resultParams?.cloud_provider_account_config_id];

          if (linkedAccountConfig) {
            isReadyToOffboard = status === "DELETING" && linkedAccountConfig?.status === "READY_TO_OFFBOARD";
          }
          // If the instance is in DELETING status and there is no linked account config, assume that it is being offboarding
          isOffboarding = status === "DELETING" && !linkedAccountConfig;

          if (isReadyToOffboard) {
            statusStylesAndLabel = {
              ...chipCategoryColors.unknown,
              label: "Ready to Offboard",
            };
          }

          if (isOffboarding) {
            statusStylesAndLabel = {
              ...chipCategoryColors.unknown,
              label: "Offboarding",
            };
          }

          const showDisconnectInstructions = ["PENDING_DETACHING", "DETACHING", "DISCONNECTING"].includes(
            status as string
          );

          const showConnectInstructions = ["CONNECTING", "ATTACHING"].includes(status as string);

          return (
            <Stack direction="row" alignItems="center" gap="6px" width="104px" justifyContent="space-between">
              <Box flex={1}>
                <StatusChip status={status} {...statusStylesAndLabel} />
              </Box>
              {isReadyToOffboard && (
                <Tooltip title="View offboarding instructions">
                  <Box
                    sx={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                    onClick={() => {
                      setClickedInstance(data.row.original);
                      setSelectedRows([data.row.original.id as string]);
                      setIsOverlayOpen(true);
                      setOverlayType("delete-dialog");
                    }}
                  >
                    <ViewInstructionsIcon />
                  </Box>
                </Tooltip>
              )}
              {showInstructions && (
                <Tooltip title="View account configuration instructions">
                  <Box
                    sx={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                    onClick={() => {
                      setClickedInstance(data.row.original);
                      setIsOverlayOpen(true);
                      setOverlayType("view-instructions-dialog");
                    }}
                  >
                    <ViewInstructionsIcon />
                  </Box>
                </Tooltip>
              )}

              {(showDisconnectInstructions || showConnectInstructions) && (
                <Tooltip
                  title={
                    showDisconnectInstructions
                      ? "View disconnect cloud account"
                      : showConnectInstructions
                        ? "View connect cloud account"
                        : ""
                  }
                >
                  <Box
                    sx={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                    onClick={() => {
                      setClickedInstance(data.row.original);
                      if (showDisconnectInstructions) {
                        setOverlayType("disconnect-dialog");
                        setIsOverlayOpen(true);
                      }
                      if (showConnectInstructions) {
                        setOverlayType("connect-dialog");
                        setIsOverlayOpen(true);
                      }
                    }}
                  >
                    <ViewInstructionsIcon />
                  </Box>
                </Tooltip>
              )}
            </Stack>
          );
        },
        meta: {
          minWidth: 200,
        },
      }),
      columnHelper.accessor(
        (row) => {
          const subscription = subscriptionsObj[row.subscriptionId as string];
          return subscription?.serviceName;
        },
        {
          id: "serviceName",
          header: "Product Name",
          cell: (data) => {
            const { serviceLogoURL, serviceName } = subscriptionsObj[data.row.original.subscriptionId as string] || {};
            return <ServiceNameWithLogo serviceName={serviceName} serviceLogoURL={serviceLogoURL} />;
          },
          meta: {
            minWidth: 230,
          },
        }
      ),
      columnHelper.accessor(
        (row) => {
          const subscription = subscriptionsObj[row.subscriptionId as string];
          return subscription?.productTierName || "-";
        },
        {
          id: "servicePlanName",
          header: "Subscription Plan",
        }
      ),

      columnHelper.accessor(
        // @ts-ignore
        (row) => {
          let cloudProvider: CloudProvider | undefined;
          const resultParams = getResultParams(row);
          if (resultParams?.aws_account_id) cloudProvider = "aws";
          else if (resultParams?.gcp_project_id) cloudProvider = "gcp";
          else if (resultParams?.azure_subscription_id) cloudProvider = "azure";
          else if (resultParams?.oci_tenancy_id) cloudProvider = "oci";
          else if (resultParams?.nebius_tenant_id) cloudProvider = "nebius";
          return cloudProvider;
        },
        {
          id: "cloud_provider",
          header: "Cloud Provider",
          cell: (data) => {
            let cloudProvider: CloudProvider | undefined;
            const resultParams = getResultParams(data.row.original);
            if (resultParams?.aws_account_id) cloudProvider = "aws";
            else if (resultParams?.gcp_project_id) cloudProvider = "gcp";
            else if (resultParams?.azure_subscription_id) cloudProvider = "azure";
            else if (resultParams?.oci_tenancy_id) cloudProvider = "oci";
            else if (resultParams?.nebius_tenant_id) cloudProvider = "nebius";

            return cloudProvider ? cloudProviderLongLogoMap[cloudProvider] : "-";
          },
        }
      ),
      columnHelper.accessor(
        (row) => {
          const subscription = subscriptionsObj[row.subscriptionId as string];
          return subscription?.subscriptionOwnerName;
        },
        {
          id: "subscriptionOwner",
          header: "Subscription Owner",
        }
      ),
      columnHelper.accessor((row) => formatDateUTC(row.created_at), {
        id: "created_at",
        header: "Created On",
        cell: (data) => {
          return data.row.original.created_at ? formatDateUTC(data.row.original.created_at) : "-";
        },
        meta: {
          minWidth: 225,
        },
      }),
    ];
  }, [subscriptionsObj, accountConfigsHash]);

  const selectedInstance = useMemo(() => {
    return instances.find((instance) => instance.id === selectedRows[0]);
  }, [selectedRows, instances]);

  const selectedAccountConfig: AccountConfig | undefined = useMemo(() => {
    if (selectedInstance) {
      const resultParams = getResultParams(selectedInstance);
      if (resultParams?.cloud_provider_account_config_id) {
        return accountConfigsHash[resultParams.cloud_provider_account_config_id];
      }
    }
  }, [selectedInstance, accountConfigsHash]);

  const isSelectedInstanceReadyToOffboard = getOffboardReadiness(
    selectedInstance?.status,
    selectedAccountConfig?.status
  );

  useEffect(() => {
    if (!isFetchingInstances && !isFetchingAccountConfigs) {
      refetchAccountConfigs();
    }

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instances, isFetchingInstances]);

  const offboardingInstructionDetails: OffboardInstructionDetails = useMemo(() => {
    // Use clickedInstance as a stable fallback: the describe-query refetch that runs
    // during polling briefly sets instances=[] (new query key), making selectedInstance
    // undefined. clickedInstance holds a snapshot captured when the dialog opened.
    const instance = selectedInstance || clickedInstance;
    const resultParams = getResultParams(instance);
    let details: any = {};
    if (resultParams?.aws_account_id) {
      details = {
        awsAccountID: resultParams?.aws_account_id,
      };
    } else if (resultParams?.gcp_project_id) {
      details = {
        gcpProjectID: resultParams?.gcp_project_id,
        gcpProjectNumber: resultParams?.gcp_project_number,
      };
      if (resultParams?.cloud_provider_account_config_id) {
        details.gcpOffboardCommand =
          selectedAccountConfig?.gcpOffboardShellCommand ||
          getGcpShellScriptOffboardCommand(resultParams?.cloud_provider_account_config_id);
      }
    } else if (resultParams?.azure_subscription_id) {
      details = {
        azureSubscriptionID: resultParams?.azure_subscription_id,
        azureTenantID: resultParams?.azure_tenant_id,
      };
      if (resultParams?.cloud_provider_account_config_id) {
        details.azureOffboardCommand =
          selectedAccountConfig?.azureOffboardShellCommand ||
          getAzureShellScriptOffboardCommand(resultParams?.cloud_provider_account_config_id);
      }
    } else if (resultParams?.oci_tenancy_id) {
      details = {
        ociTenancyID: resultParams?.oci_tenancy_id,
        ociDomainID: resultParams?.oci_domain_id,
      };
      if (resultParams?.cloud_provider_account_config_id) {
        details.ociOffboardCommand =
          selectedAccountConfig?.ociOffboardShellCommand ||
          getOciShellScriptOffboardCommand(resultParams?.cloud_provider_account_config_id);
      }
    }
    return details;
  }, [selectedInstance, clickedInstance, selectedAccountConfig]);

  // Subscription of the Selected Instance
  const selectedInstanceSubscription = useMemo(() => {
    return subscriptionsObj[selectedInstance?.subscriptionId as string];
  }, [selectedInstance, subscriptionsObj]);

  // Offering of the Selected Instance
  const selectedInstanceOffering = useMemo(() => {
    const { serviceId, productTierId } = selectedInstanceSubscription || {};
    return serviceOfferingsObj[serviceId]?.[productTierId];
  }, [selectedInstanceSubscription, serviceOfferingsObj]);

  // Resource
  const selectedResource = useMemo(() => {
    return selectedInstanceOffering?.resourceParameters?.find((resource) =>
      resource.resourceId.startsWith("r-injectedaccountconfig")
    );
  }, [selectedInstanceOffering?.resourceParameters]);

  // Local state for polled data used only by the delete dialog
  const [polledInstanceStatus, setPolledInstanceStatus] = useState<string | undefined>();
  const [polledAccountConfig, setPolledAccountConfig] = useState<AccountConfig | undefined>();
  const pollCountRef = useRef(0);

  const deleteCloudAccountInstanceMutation = useMutation({
    mutationFn: () => {
      const requestPayload = {
        serviceProviderId: selectedInstanceOffering?.serviceProviderId,
        serviceKey: selectedInstanceOffering?.serviceURLKey,
        serviceAPIVersion: selectedInstanceOffering?.serviceAPIVersion,
        serviceEnvironmentKey: selectedInstanceOffering?.serviceEnvironmentURLKey,
        serviceModelKey: selectedInstanceOffering?.serviceModelURLKey,
        productTierKey: selectedInstanceOffering?.productTierURLKey,
        resourceKey: selectedResource?.urlKey,
        id: selectedInstance?.id,
        subscriptionId: selectedInstance?.subscriptionId,
      };
      return deleteResourceInstance(requestPayload);
    },
    onSuccess: async () => {
      const isLastInstance =
        !selectedAccountConfig?.byoaInstanceIDs || selectedAccountConfig?.byoaInstanceIDs?.length === 1;
      if (!isLastInstance) {
        setSelectedRows([]);
        setIsOverlayOpen(false);
        snackbar.showSuccess("Deleting cloud account...");
        await refetchInstances();
        // refetchAccountConfigs();
      } else {
        // Use polled data (if available) for offboard readiness check — selectedAccountConfig
        // may be stale (e.g. already deleted by the offboard API call before onSuccess runs).
        const currentInstanceStatus = polledInstanceStatus ?? selectedInstance?.status;
        const currentAccountConfigStatus = polledAccountConfig?.status ?? selectedAccountConfig?.status;
        const isOffboardReady = getOffboardReadiness(currentInstanceStatus, currentAccountConfigStatus);

        if (isOffboardReady || currentInstanceStatus === "FAILED") {
          // Offboard step 2 completed — close dialog immediately and refresh the list.
          // The offboard API call is the final action; no polling is needed.
          setIsOverlayOpen(false);
          setSelectedRows([]);
          snackbar.showSuccess("Deleting cloud account...");
          await refetchInstances();
        } else {
          // Instance is transitioning to DELETING — start polling to track progress
          // and keep the dialog in loading state until offboard is ready.
          setHasRequestedDeleteForPolling(true);
        }
      }
    },
    onError: async () => {
      setSelectedRows([]);
      setIsOverlayOpen(false);

      snackbar.showError("Something went wrong. Please try again.");
    },
  });

  const showDeleteDialog = isOverlayOpen && overlayType === "delete-dialog";

  // Derive the account config ID for the selected instance
  const selectedAccountConfigId = useMemo(() => {
    const resultParams = getResultParams(selectedInstance);
    return resultParams?.cloud_provider_account_config_id;
  }, [selectedInstance]);

  // Use polled data when available, otherwise fall back to the original data.
  // These merged values drive both the dialog display and the polling stop condition.
  const deleteDialogInstanceStatus = polledInstanceStatus ?? selectedInstance?.status;
  const deleteDialogAccountConfig = polledAccountConfig ?? selectedAccountConfig;

  const isLastInstance =
    !deleteDialogAccountConfig?.byoaInstanceIDs || deleteDialogAccountConfig?.byoaInstanceIDs?.length === 1;
  const isMultiStepDialog = Boolean(isLastInstance && deleteDialogAccountConfig);

  const shouldPollDeleteDialogStatus = shouldPollInstanceStatus({
    open: showDeleteDialog,
    instanceStatus: deleteDialogInstanceStatus,
    accountConfigStatus: deleteDialogAccountConfig?.status,
    isMultiStepDialog,
    hasRequestedDeletion: hasRequestedDeleteForPolling,
  });

  // Instance describe query — disabled by default, refetched manually during polling.
  const describeQuery = useInstancesDescribe({
    serviceProviderId: selectedInstanceOffering?.serviceProviderId ?? "",
    serviceKey: selectedInstanceOffering?.serviceURLKey ?? "",
    serviceAPIVersion: selectedInstanceOffering?.serviceAPIVersion ?? "",
    serviceEnvironmentKey: selectedInstanceOffering?.serviceEnvironmentURLKey ?? "",
    serviceModelKey: selectedInstanceOffering?.serviceModelURLKey ?? "",
    productTierKey: selectedInstanceOffering?.productTierURLKey ?? "",
    resourceKey: selectedResource?.urlKey ?? "",
    id: selectedInstance?.id ?? "",
    subscriptionId: selectedInstance?.subscriptionId,
    ignoreGlobalError: true,
    enabled: Boolean(showDeleteDialog && selectedInstance?.id),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    retry: false,
  });

  // Derive account config ID from describe query data (polled) or fall back to selected instance
  const describeResultParams = getResultParams(describeQuery.data ?? undefined);
  const polledAccountConfigId = describeResultParams?.cloud_provider_account_config_id as string | undefined;

  // Account config query — disabled by default, refetched manually during polling.
  const accountConfigQuery = useAccountConfig({
    accountConfigId: polledAccountConfigId ?? selectedAccountConfigId ?? "",
    enabled: Boolean(showDeleteDialog && (polledAccountConfigId || selectedAccountConfigId)),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    retry: false,
  });

  // Reset polled state when dialog opens/closes
  useEffect(() => {
    if (!showDeleteDialog) {
      setPolledInstanceStatus(undefined);
      setPolledAccountConfig(undefined);
      pollCountRef.current = 0;
      if (hasRequestedDeleteForPolling) {
        setHasRequestedDeleteForPolling(false);
      }
    }
  }, [showDeleteDialog, hasRequestedDeleteForPolling]);

  // Reset the step-1 deletion polling flag when the dialog naturally transitions to the
  // offboard step (offboard-ready condition met), so the spinner doesn't persist on step 2.
  useEffect(() => {
    if (!hasRequestedDeleteForPolling) return;
    const isOffboardReady =
      deleteDialogAccountConfig?.status === "READY_TO_OFFBOARD" || deleteDialogInstanceStatus === "FAILED";
    if (isOffboardReady) {
      setHasRequestedDeleteForPolling(false);
    }
  }, [hasRequestedDeleteForPolling, deleteDialogAccountConfig?.status, deleteDialogInstanceStatus]);

  // Polling: fetch instance describe + account config to track deletion progress.
  // Only runs for 2-step dialogs after deletion has been requested.
  // Stops when: offboard step ready (shouldPoll becomes false), max retries, instance gone from list, or error.
  useEffect(() => {
    if (!shouldPollDeleteDialogStatus) {
      return;
    }

    pollCountRef.current = 0;

    const stopPolling = () => {
      setHasRequestedDeleteForPolling(false);
    };

    const pollingInterval = window.setInterval(async () => {
      pollCountRef.current += 1;

      if (pollCountRef.current >= MAX_POLL_COUNT) {
        window.clearInterval(pollingInterval);
        stopPolling();
        return;
      }

      try {
        const [instanceResult] = await Promise.allSettled([describeQuery.refetch()]);
        const [accountConfigResult] = await Promise.allSettled([accountConfigQuery.refetch()]);

        // Detect errors from refetch results
        const hasInstanceError =
          instanceResult.status === "rejected" ||
          (instanceResult.status === "fulfilled" && instanceResult.value.isError);
        const hasAccountConfigError =
          accountConfigResult.status === "rejected" ||
          (accountConfigResult.status === "fulfilled" && accountConfigResult.value.isError);

        //errors — stop polling, keep dialog open
        if (hasInstanceError) {
          window.clearInterval(pollingInterval);
          stopPolling();
          setIsOverlayOpen(false);
          setSelectedRows([]);
          await refetchInstances();
          return;
        }

        // Update polled data from successful responses
        if (instanceResult.status === "fulfilled" && instanceResult.value.data) {
          const instanceData = instanceResult.value.data as ResourceInstance;
          setPolledInstanceStatus(instanceData.status);
        }
        if (accountConfigResult.status === "fulfilled" && accountConfigResult.value.data && !hasAccountConfigError) {
          setPolledAccountConfig(accountConfigResult.value.data as AccountConfig);
        }
      } catch {
        window.clearInterval(pollingInterval);
        stopPolling();
        setIsOverlayOpen(false);
        setSelectedRows([]);
      }
    }, INSTANCE_STATUS_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(pollingInterval);
    };
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldPollDeleteDialogStatus]);

  const updateInstanceMetadataMutation = $api.useMutation(
    "patch",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}/metadata",
    {
      onSuccess: async () => {
        refetchInstances();
        setSelectedRows([]);
        if (overlayType === "enable-deletion-protection-dialog") {
          snackbar.showSuccess("Delete protection enabled successfully");
        } else {
          snackbar.showSuccess("Delete protection disabled successfully");
        }
      },
    }
  );

  // const deleteAccountConfigMutation = $api.useMutation("delete", "/2022-09-01-00/accountconfig/{id}", {
  //   onSuccess: () => {
  //     //refetch cloud account instances
  //     //refectAccountConfigs
  //     //close confirmation dialog
  //     //clear dialog form state
  //   },
  // });

  const clickedInstanceSubscription = useMemo(() => {
    return subscriptionsObj[clickedInstance?.subscriptionId as string];
  }, [clickedInstance, subscriptionsObj]);

  const clickedInstanceOffering = useMemo(() => {
    const { serviceId, productTierId } = clickedInstanceSubscription || {};
    return serviceOfferingsObj[serviceId]?.[productTierId];
  }, [clickedInstanceSubscription, serviceOfferingsObj]);

  const fetchClickedInstanceDetails = async () => {
    return await getResourceInstanceDetails(
      clickedInstanceOffering?.serviceProviderId,
      clickedInstanceOffering?.serviceURLKey,
      clickedInstanceOffering?.serviceAPIVersion,
      clickedInstanceOffering?.serviceEnvironmentURLKey,
      clickedInstanceOffering?.serviceModelURLKey,
      clickedInstanceOffering?.productTierURLKey,
      selectedResource?.urlKey,
      clickedInstance?.id,
      clickedInstance?.subscriptionId
    );
  };

  useEffect(() => {
    if (isAccountCreation) {
      setIsOverlayOpen(true);
      setOverlayType("view-instructions-dialog");
    }
  }, [isAccountCreation]);

  const selectedInstanceData = useMemo(() => {
    return {
      id: selectedInstance?.id || "",
      serviceProviderId: selectedInstanceOffering?.serviceProviderId || "",
      serviceKey: selectedInstanceOffering?.serviceURLKey || "",
      serviceAPIVersion: selectedInstanceOffering?.serviceAPIVersion || "",
      serviceEnvironmentKey: selectedInstanceOffering?.serviceEnvironmentURLKey || "",
      serviceModelKey: selectedInstanceOffering?.serviceModelURLKey || "",
      productTierKey: selectedInstanceOffering?.productTierURLKey || "",
      resourceKey: selectedResource?.urlKey as string,
      subscriptionId: selectedInstanceSubscription?.id,
    };
  }, [selectedInstance, selectedInstanceOffering, selectedInstanceSubscription, selectedResource]);

  return (
    <PageContainer>
      <PageTitle icon={CloudAccountsIcon} className="mb-6">
        Cloud Accounts
      </PageTitle>

      <div>
        <DataTable
          key={Object.keys(subscriptionsObj).length} // Force re-render when subscriptionsObj changes
          columns={dataTableColumns}
          rows={byoaInstances}
          noRowsText="No cloud accounts"
          HeaderComponent={CloudAccountsTableHeader}
          headerProps={{
            count: byoaInstances.length,
            searchText,
            setSearchText,
            onCreateClick: () => {
              setSelectedRows([]);
              setIsOverlayOpen(true);
              setOverlayType("create-instance-form");
            },
            onDeleteClick: () => {
              setClickedInstance(selectedInstance);
              setIsOverlayOpen(true);
              setOverlayType("delete-dialog");
            },

            onModifyClick: () => {
              setClickedInstance(selectedInstance);
              setIsOverlayOpen(true);
              setOverlayType("modify-instance-form");
            },

            onOffboardClick: () => {
              setClickedInstance(selectedInstance);
              setIsOverlayOpen(true);
              setOverlayType("delete-dialog");
            },
            onConnectClick: () => {
              setClickedInstance(selectedInstance);
              setIsOverlayOpen(true);
              setOverlayType("connect-dialog");
            },
            onDisconnectClick: () => {
              setClickedInstance(selectedInstance);
              setIsOverlayOpen(true);
              setOverlayType("disconnect-dialog");
            },
            selectedInstance,
            refetchInstances: refetchInstances,
            isFetchingInstances: isFetchingInstances,
            refetchAccountConfigs: refetchAccountConfigs,
            isFetchingAccountConfigs: isFetchingAccountConfigs,
            isSelectedInstanceReadyToOffboard: isSelectedInstanceReadyToOffboard,
            setOverlayType: setOverlayType,
            setIsOverlayOpen: setIsOverlayOpen,
            selectedInstanceSubscription,
            serviceModelType: selectedInstanceOffering?.serviceModelType,
          }}
          isLoading={isInstancesPending || isAccountConfigsPending}
          selectionMode="single"
          selectedRows={selectedRows}
          onRowSelectionChange={setSelectedRows}
        />
      </div>

      <FullScreenDrawer
        title="Cloud Account"
        description={
          overlayType === "modify-instance-form" ? "Modify this cloud account" : "Create a new cloud account"
        }
        open={
          isOverlayOpen &&
          (overlayType === "create-instance-form" ||
            overlayType === "view-instance-form" ||
            overlayType === "modify-instance-form")
        }
        closeDrawer={() => {
          setIsOverlayOpen(false);
          setClickedInstance(undefined);
        }}
        RenderUI={
          <CloudAccountForm
            initialFormValues={initialFormValues}
            selectedInstance={selectedInstance}
            selectedAccountConfig={selectedAccountConfig}
            onClose={() => {
              setIsOverlayOpen(false);
            }}
            formMode={
              overlayType === "view-instance-form"
                ? "view"
                : overlayType === "modify-instance-form"
                  ? "modify"
                  : "create"
            }
            setIsAccountCreation={setIsAccountCreation}
            setOverlayType={setOverlayType}
            setClickedInstance={setClickedInstance}
            instances={instances}
            refetchInstances={refetchInstances}
            refetchAccountConfigs={refetchAccountConfigs}
          />
        }
      />

      <DeleteAccountConfigConfirmationDialog
        open={isOverlayOpen && overlayType === "delete-dialog"}
        onClose={async () => {
          setHasRequestedDeleteForPolling(false);
          setIsOverlayOpen(false);
          setSelectedRows([]);
          setClickedInstance(undefined);
          // Reset mutation state if dialog is closed before backend responds
          if (shouldResetDeleteMutationOnClose(deleteCloudAccountInstanceMutation.isPending)) {
            deleteCloudAccountInstanceMutation.reset();
          }
          await refetchInstances();
        }}
        isDeleteInstanceMutationPending={deleteCloudAccountInstanceMutation.isPending}
        // isDeletingAccountConfig={deleteAccountConfigMutation.isPending}
        accountConfig={deleteDialogAccountConfig}
        isPollingActive={hasRequestedDeleteForPolling}
        onInstanceDeleteClick={async () => {
          if (!selectedInstance) return snackbar.showError("No instance selected");
          if (!selectedResource) return snackbar.showError("Resource not found");
          await deleteCloudAccountInstanceMutation.mutateAsync();
        }}
        onOffboardClick={async () => {
          if (!selectedInstance) return snackbar.showError("No instance selected");
          if (selectedInstance && selectedInstance?.status === "DELETING" && !selectedAccountConfig)
            return snackbar.showError("Offboarding is in progress");
          if (!selectedResource) return snackbar.showError("Resource not found");
          await deleteCloudAccountInstanceMutation.mutateAsync();
          // onSuccess closes the dialog and refetches — no extra cleanup needed here.
        }}
        instanceStatus={deleteDialogInstanceStatus}
        offboardingInstructionDetails={offboardingInstructionDetails}
        instanceId={selectedInstance?.id}
      />

      <ConnectAccountConfigDialog
        open={isOverlayOpen && overlayType === "connect-dialog"}
        handleClose={() => {
          setIsOverlayOpen(false);
        }}
        isFetching={isFetchingInstances}
        instance={selectedInstance || clickedInstance}
        refetchInstances={refetchInstances}
        fetchClickedInstanceDetails={fetchClickedInstanceDetails}
        setClickedInstance={setClickedInstance}
        serviceId={selectedInstanceSubscription?.serviceId}
        serviceProviderName={selectedInstanceOffering?.serviceProviderName}
      />

      <DisconnectAccountConfigDialog
        open={isOverlayOpen && overlayType === "disconnect-dialog"}
        handleClose={() => {
          setIsOverlayOpen(false);
        }}
        isFetching={isFetchingInstances}
        instance={selectedInstance || clickedInstance}
        refetchInstances={refetchInstances}
        fetchClickedInstanceDetails={fetchClickedInstanceDetails}
        setClickedInstance={setClickedInstance}
        serviceId={selectedInstanceSubscription?.serviceId}
        serviceProviderName={selectedInstanceOffering?.serviceProviderName}
      />
      <CloudProviderAccountOrgIdModal
        isAccessPage
        open={isOverlayOpen && overlayType === "view-instructions-dialog"}
        handleClose={() => {
          setIsOverlayOpen(false);
          setClickedInstance(undefined);
          setIsAccountCreation(false);
        }}
        accountConfigId={clickedInstance?.id}
        selectedAccountConfig={clickedInstance}
        cloudFormationTemplateUrl={awsCloudFormationTemplateUrl}
        isAccountCreation={isAccountCreation}
        gcpBootstrapShellCommand={gcpBootstrapShellCommand}
        azureBootstrapShellCommand={azureBootstrapShellCommand}
        accountInstructionDetails={accountInstructionDetails}
        accountConfigMethod={getResultParams(clickedInstance)?.account_configuration_method}
        fetchClickedInstanceDetails={fetchClickedInstanceDetails}
        setClickedInstance={setClickedInstance}
      />

      <TextConfirmationDialog
        open={isOverlayOpen && Object.keys(DIALOG_DATA).includes(overlayType)}
        handleClose={() => setIsOverlayOpen(false)}
        onConfirm={async () => {
          if (!selectedInstance) return snackbar.showError("No instance selected");
          if (!selectedInstanceOffering) {
            return snackbar.showError("Offering not found");
          }
          if (!selectedInstanceSubscription) {
            return snackbar.showError("Subscription not found");
          }
          if (!selectedResource) {
            return snackbar.showError("Resource not found");
          }
          if (!selectedInstance || !selectedInstanceOffering || !selectedInstanceSubscription || !selectedResource)
            return false;

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
                subscriptionId: selectedInstanceSubscription?.id,
              },
            },
          };

          if (
            overlayType === "enable-deletion-protection-dialog" ||
            overlayType === "disable-deletion-protection-dialog"
          ) {
            await updateInstanceMetadataMutation.mutateAsync({
              ...body,
              body: {
                deletionProtection: overlayType === "enable-deletion-protection-dialog" ? true : false,
              },
            });
          }
          return true;
        }}
        IconComponent={DIALOG_DATA[overlayType]?.icon}
        title={DIALOG_DATA[overlayType]?.title}
        subtitle={<>{`${DIALOG_DATA[overlayType]?.subtitle} - ${selectedInstanceData?.id}?`}</>}
        confirmationText={DIALOG_DATA[overlayType]?.confirmationText}
        buttonLabel={DIALOG_DATA[overlayType]?.buttonLabel}
        buttonColor={DIALOG_DATA[overlayType]?.buttonColor}
        isLoading={updateInstanceMetadataMutation.isPending}
      />
    </PageContainer>
  );
};

export default CloudAccountsPage;

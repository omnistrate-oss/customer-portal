"use client";

import { useEffect, useMemo, useState } from "react";
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
import useInstances from "../instances/hooks/useInstances";

import CloudAccountForm from "./components/CloudAccountForm";
import CloudAccountsTableHeader from "./components/CloudAccountsTableHeader";
import DeleteAccountConfigConfirmationDialog from "./components/DeleteConfirmationDialog";
import { OffboardInstructionDetails } from "./components/OffboardingInstructions";
import { DIALOG_DATA } from "./constants";
import { getOffboardReadiness } from "./utils";

const columnHelper = createColumnHelper<ResourceInstance>();

export type Overlay =
  | "delete-dialog"
  | "create-instance-form"
  | "view-instance-form"
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
  const [initialFormValues, setInitialFormValues] = useState<any>();
  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [overlayType, setOverlayType] = useState<Overlay>("create-instance-form");
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isAccountCreation, setIsAccountCreation] = useState(false);
  const [clickedInstance, setClickedInstance] = useState<ResourceInstance>();

  const awsCloudFormationTemplateUrl = useMemo(() => {
    const result_params: any = clickedInstance?.result_params;
    return result_params?.cloudformation_url;
  }, [clickedInstance]);

  const gcpBootstrapShellCommand = useMemo(() => {
    const result_params: any = clickedInstance?.result_params;
    if (result_params?.gcp_bootstrap_shell_script) {
      return result_params?.gcp_bootstrap_shell_script;
    } else if (result_params?.cloud_provider_account_config_id) {
      return getGcpBootstrapShellCommand(result_params?.cloud_provider_account_config_id);
    }
  }, [clickedInstance]);

  const azureBootstrapShellCommand = useMemo(() => {
    const result_params: any = clickedInstance?.result_params;
    if (result_params?.azure_bootstrap_shell_script) {
      return result_params?.azure_bootstrap_shell_script;
    } else if (result_params?.cloud_provider_account_config_id) {
      return getAzureBootstrapShellCommand(result_params?.cloud_provider_account_config_id);
    }
  }, [clickedInstance]);

  const accountInstructionDetails = useMemo(() => {
    const result_params: any = clickedInstance?.result_params;
    let details = {};
    if (result_params?.aws_account_id) {
      details = {
        awsAccountID: result_params?.aws_account_id,
      };
    } else if (result_params?.gcp_project_id) {
      details = {
        gcpProjectID: result_params?.gcp_project_id,
        gcpProjectNumber: result_params?.gcp_project_number,
      };
    } else if (result_params?.azure_subscription_id) {
      details = {
        azureSubscriptionID: result_params?.azure_subscription_id,
        azureTenantID: result_params?.azure_tenant_id,
      };
    } else if (result_params?.oci_tenancy_id) {
      details = {
        ociTenancyID: result_params?.oci_tenancy_id,
        ociDomainID: result_params?.oci_domain_id,
        ociBootstrapShellCommand: result_params?.oci_bootstrap_shell_script,
      };
    }
    return details;
  }, [clickedInstance]);

  const {
    data: instances = [],
    isPending: isInstancesPending,
    isFetching: isFetchingInstances,
    refetch: refetchInstances,
  } = useInstances();

  const accountConfigIds = useMemo(() => {
    const ids = new Set<string>();
    instances.forEach((instance) => {
      const resultParams = instance?.result_params as Record<string, any>;
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
      return res.filter(
        (instance) =>
          // @ts-ignore
          instance.result_params?.gcp_project_id?.toLowerCase().includes(searchText.toLowerCase()) ||
          // @ts-ignore
          instance.result_params?.aws_account_id?.toLowerCase().includes(searchText.toLowerCase()) ||
          // @ts-ignore
          instance.result_params?.azure_subscription_id?.toLowerCase().includes(searchText.toLowerCase()) ||
          // @ts-ignore
          instance.result_params?.oci_tenancy_id?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return res;
  }, [instances, searchText]);

  const dataTableColumns = useMemo(() => {
    return [
      columnHelper.accessor(
        (row) =>
          // @ts-ignore
          row.result_params?.gcp_project_id ||
          // @ts-ignore
          row.result_params?.aws_account_id ||
          // @ts-ignore
          row.result_params?.azure_subscription_id ||
          // @ts-ignore
          row.result_params?.oci_tenancy_id ||
          "-",
        {
          id: "account_id",
          header: "Account ID / Project ID",
          cell: (data) => {
            const value =
              // @ts-ignore
              data.row.original.result_params?.gcp_project_id ||
              // @ts-ignore
              data.row.original.result_params?.aws_account_id ||
              // @ts-ignore
              data.row.original.result_params?.azure_subscription_id ||
              // @ts-ignore
              data.row.original.result_params?.oci_tenancy_id ||
              "-";

            const deletionProtectionFeatureEnabled =
              data.row.original?.resourceInstanceMetadata?.deletionProtection !== undefined;
            const isDeleteProtected = data.row.original?.resourceInstanceMetadata?.deletionProtection;

            return (
              <GridCellExpand
                value={value}
                copyButton={value !== "-"}
                endIcon={
                  deletionProtectionFeatureEnabled && (
                    <Box sx={{ marginRight: "-2px", marginTop: "-7px" }}>
                      <Tooltip title={isDeleteProtected ? "Delete protection enabled" : "Delete protection disabled"}>
                        <span>
                          <DeleteProtectionIcon disabled={!isDeleteProtected} />
                        </span>
                      </Tooltip>
                    </Box>
                  )
                }
              />
            );
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
          const showInstructions = [
            "VERIFYING",
            "PENDING",
            "PENDING_DEPENDENCY",
            "UNKNOWN",
            "DEPLOYING",
            "READY",
            "FAILED",
          ].includes(status as string);

          let isReadyToOffboard = false;
          let isOffboarding = false;
          const resultParams = data.row.original.result_params as Record<string, any> | undefined;

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
              {showDisconnectInstructions && (
                <Tooltip title="View disconnect cloud account">
                  <Box
                    sx={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                    onClick={() => {
                      setClickedInstance(data.row.original);
                      setIsOverlayOpen(true);
                      setOverlayType("disconnect-dialog");
                    }}
                  >
                    <ViewInstructionsIcon />
                  </Box>
                </Tooltip>
              )}
              {showConnectInstructions && (
                <Tooltip title="View connect cloud account">
                  <Box
                    sx={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                    onClick={() => {
                      setClickedInstance(data.row.original);
                      setIsOverlayOpen(true);
                      setOverlayType("connect-dialog");
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
          const result_params = row.result_params;
          // @ts-ignore
          if (result_params?.aws_account_id) cloudProvider = "aws";
          // @ts-ignore
          else if (result_params?.gcp_project_id) cloudProvider = "gcp";
          // @ts-ignore
          else if (result_params?.azure_subscription_id) cloudProvider = "azure";
          // @ts-ignore
          else if (result_params?.oci_tenancy_id) cloudProvider = "oci";
          return cloudProvider;
        },
        {
          id: "cloud_provider",
          header: "Cloud Provider",
          cell: (data) => {
            let cloudProvider: CloudProvider | undefined;
            const result_params = data.row.original.result_params;
            // @ts-ignore
            if (result_params?.aws_account_id) cloudProvider = "aws";
            // @ts-ignore
            else if (result_params?.gcp_project_id) cloudProvider = "gcp";
            // @ts-ignore
            else if (result_params?.azure_subscription_id) cloudProvider = "azure";
            // @ts-ignore
            else if (result_params?.oci_tenancy_id) cloudProvider = "oci";

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
      const resultParams = selectedInstance?.result_params as Record<string, any>;
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
    const result_params: any = selectedInstance?.result_params;
    let details: any = {};
    if (result_params?.aws_account_id) {
      details = {
        awsAccountID: result_params?.aws_account_id,
      };
    } else if (result_params?.gcp_project_id) {
      details = {
        gcpProjectID: result_params?.gcp_project_id,
        gcpProjectNumber: result_params?.gcp_project_number,
      };
      if (result_params?.cloud_provider_account_config_id) {
        details.gcpOffboardCommand =
          selectedAccountConfig?.gcpOffboardShellCommand ||
          getGcpShellScriptOffboardCommand(result_params?.cloud_provider_account_config_id);
      }
    } else if (result_params?.azure_subscription_id) {
      details = {
        azureSubscriptionID: result_params?.azure_subscription_id,
        azureTenantID: result_params?.azure_tenant_id,
      };
      if (result_params?.cloud_provider_account_config_id) {
        details.azureOffboardCommand =
          selectedAccountConfig?.azureOffboardShellCommand ||
          getAzureShellScriptOffboardCommand(result_params?.cloud_provider_account_config_id);
      }
    } else if (result_params?.oci_tenancy_id) {
      details = {
        ociTenancyID: result_params?.oci_tenancy_id,
        ociDomainID: result_params?.oci_domain_id,
      };
      if (result_params?.cloud_provider_account_config_id) {
        details.ociOffboardCommand =
          selectedAccountConfig?.ociOffboardShellCommand ||
          getOciShellScriptOffboardCommand(result_params?.cloud_provider_account_config_id);
      }
    }
    return details;
  }, [selectedInstance, selectedAccountConfig]);

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
        setTimeout(async () => {
          await refetchInstances();
        }, 1700);
      }
    },
    onError: async () => {
      setSelectedRows([]);
      setIsOverlayOpen(false);
      await refetchInstances();
      snackbar.showError("Something went wrong. Please try again.");
    },
  });

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
              setIsOverlayOpen(true);
              setOverlayType("delete-dialog");
            },

            onOffboardClick: () => {
              setClickedInstance(selectedInstance);
              setIsOverlayOpen(true);
              setOverlayType("delete-dialog");
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
          }}
          isLoading={isInstancesPending || isAccountConfigsPending}
          selectionMode="single"
          selectedRows={selectedRows}
          onRowSelectionChange={setSelectedRows}
        />
      </div>

      <FullScreenDrawer
        title="Cloud Account"
        description="Create a new cloud account"
        open={isOverlayOpen && (overlayType === "create-instance-form" || overlayType === "view-instance-form")}
        closeDrawer={() => {
          setIsOverlayOpen(false);
          setClickedInstance(undefined);
        }}
        RenderUI={
          <CloudAccountForm
            initialFormValues={initialFormValues}
            selectedInstance={selectedInstance}
            onClose={() => {
              setIsOverlayOpen(false);
            }}
            formMode={overlayType === "view-instance-form" ? "view" : "create"}
            setIsAccountCreation={setIsAccountCreation}
            setOverlayType={setOverlayType}
            setClickedInstance={setClickedInstance}
            instances={instances}
          />
        }
      />

      <DeleteAccountConfigConfirmationDialog
        open={isOverlayOpen && overlayType === "delete-dialog"}
        onClose={async () => {
          setIsOverlayOpen(false);
          setSelectedRows([]);
          setClickedInstance(undefined);
          await refetchInstances();
        }}
        isDeleteInstanceMutationPending={deleteCloudAccountInstanceMutation.isPending}
        // isDeletingAccountConfig={deleteAccountConfigMutation.isPending}
        accountConfig={selectedAccountConfig}
        isLoadingAccountConfig={isFetchingAccountConfigs}
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
          setSelectedRows([]);
        }}
        instanceStatus={selectedInstance?.status}
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
        accountConfigMethod={
          // @ts-ignore
          clickedInstance?.result_params?.account_configuration_method
        }
        fetchClickedInstanceDetails={fetchClickedInstanceDetails}
        setClickedInstance={setClickedInstance}
      />

      <TextConfirmationDialog
        open={isOverlayOpen && Object.keys(DIALOG_DATA).includes(overlayType)}
        handleClose={() => setIsOverlayOpen(false)}
        onConfirm={async () => {
          if (!selectedInstance) snackbar.showError("No instance selected");
          if (!selectedInstanceOffering) {
            snackbar.showError("Offering not found");
          }
          if (!selectedInstanceSubscription) {
            snackbar.showError("Subscription not found");
          }
          if (!selectedResource) {
            snackbar.showError("Resource not found");
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

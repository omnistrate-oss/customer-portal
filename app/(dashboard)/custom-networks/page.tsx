"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";

import { deleteCustomNetwork } from "src/api/customNetworks";
import { cloudProviderLogoMap, cloudProviderLongLogoMap } from "src/constants/cloudProviders";
import useSnackbar from "src/hooks/useSnackbar";
import { CustomNetwork } from "src/types/customNetwork";
import { getCustomNetworksRoute } from "src/utils/routes";
import DataGridText from "components/DataGrid/DataGridText";
import DataTable from "components/DataTable/DataTable";
import GridCellExpand from "components/GridCellExpand/GridCellExpand";
import RegionIcon from "components/Region/RegionIcon";
import TextConfirmationDialog from "components/TextConfirmationDialog/TextConfirmationDialog";

import FullScreenDrawer from "../components/FullScreenDrawer/FullScreenDrawer";
import CustomNetworksIcon from "../components/Icons/CustomNetworksIcon";
import PageContainer from "../components/Layout/PageContainer";
import PageTitle from "../components/Layout/PageTitle";

import CustomNetworkForm from "./components/CustomNetworkForm";
import CustomNetworksTableHeader from "./components/CustomNetworksTableHeader";
import PeeringInfoDialog, { ListItemProps } from "./components/PeeringInfoDialog";
import useCustomNetworks from "./hooks/useCustomNetworks";
import useRegions from "./hooks/useRegions";

const columnHelper = createColumnHelper<CustomNetwork>();
type Overlay = "peering-info-dialog" | "create-custom-network" | "modify-custom-network" | "delete-dialog";

const CustomNetworksPage = () => {
  const snackbar = useSnackbar();

  const router = useRouter();
  const searchParams = useSearchParams();
  const overlay = searchParams?.get("overlay");

  const [searchText, setSearchText] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [overlayType, setOverlayType] = useState<Overlay>("peering-info-dialog");
  const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);

  // Open the Create Form Overlay when the overlay query param is set to "create"
  useEffect(() => {
    if (overlay === "create") {
      setOverlayType("create-custom-network");
      setIsOverlayOpen(true);
      router.replace(getCustomNetworksRoute({}));
    }
  }, [overlay]);

  const {
    data: customNetworks = [],
    isFetching: isFetchingCustomNetworks,
    refetch: refetchCustomNetworks,
  } = useCustomNetworks();

  const filteredCustomNetworks = useMemo(() => {
    return customNetworks.filter((customNetwork) => {
      return customNetwork.name?.toLowerCase().includes(searchText.toLowerCase());
    });
  }, [customNetworks, searchText]);

  const { data: regions = [], isFetching: isFetchingRegions } = useRegions();

  const dataTableColumns = useMemo(() => {
    return [
      columnHelper.accessor("id", {
        id: "id",
        header: "Network ID",
        cell: (data) => {
          return (
            <DataGridText
              showCopyButton
              style={{
                fontWeight: 600,
              }}
            >
              {data.row.original.id}
            </DataGridText>
          );
        },
        meta: {
          minWidth: 200,
        },
      }),
      columnHelper.accessor("name", {
        id: "name",
        header: "Name",
      }),
      columnHelper.accessor("cloudProviderName", {
        id: "cloudProviderName",
        header: "Cloud Provider",
        cell: (data) => {
          const cloudProvider = data.row.original.cloudProviderName;
          return cloudProviderLongLogoMap[cloudProvider] || "-";
        },
      }),
      columnHelper.accessor("cloudProviderRegion", {
        id: "cloudProviderRegion",
        header: "Region",
        cell: (data) => {
          return (
            <GridCellExpand value={data.row.original.cloudProviderRegion || "Global"} startIcon={<RegionIcon />} />
          );
        },
      }),
      columnHelper.accessor("cidr", {
        id: "cidr",
        header: "CIDR",
      }),
    ];
  }, []);

  const deleteCustomNetworkMutation = useMutation({
    mutationFn: deleteCustomNetwork,
    onSuccess: async () => {
      setSelectedRows([]);
      refetchCustomNetworks();
      setIsOverlayOpen(false);
      snackbar.showSuccess("Customer Network deleted successfully");
    },
  });

  const peeringInfoList: ListItemProps[] = useMemo(() => {
    if (!selectedRows.length || !customNetworks) {
      return [];
    }

    const selectedCustomNetwork = customNetworks.find((customNetwork) => customNetwork.id === selectedRows[0]);

    const networkInstance = selectedCustomNetwork?.networkInstances?.[0] || {};
    const res: ListItemProps[] = [];
    if (networkInstance.awsAccountID) {
      res.push({
        title: "Account ID",
        value: networkInstance.awsAccountID,
        icon: cloudProviderLogoMap.aws,
      });
    } else if (networkInstance.gcpProjectID) {
      res.push({
        title: "Project ID",
        value: networkInstance.gcpProjectID,
        icon: cloudProviderLogoMap.gcp,
      });
      res.push({
        title: "Project Number",
        value: networkInstance.gcpProjectNumber,
      });
    } else if (networkInstance.azureSubscriptionID) {
      res.push({
        title: "Subscription ID",

        value: networkInstance.azureSubscriptionID,
        icon: cloudProviderLogoMap.azure,
      });
      res.push({
        title: "Tenant ID",

        value: networkInstance.azureTenantID,
      });
    } else if (networkInstance.ociTenancyID) {
      res.push({
        title: "Tenancy ID",
        value: networkInstance.ociTenancyID,
        icon: cloudProviderLogoMap.oci,
      });
      res.push({
        title: "Domain ID",
        value: networkInstance.ociDomainID,
      });
    }

    if (networkInstance.cloudProviderNativeNetworkId) {
      res.push({
        title: "VPC Info",
        value: networkInstance.cloudProviderNativeNetworkId,
      });
    }
    res.push({
      title: "CIDR",
      value: selectedCustomNetwork?.cidr,
    });

    return res;
  }, [customNetworks, selectedRows]);

  return (
    <PageContainer>
      <PageTitle icon={CustomNetworksIcon} className="mb-6">
        Customer Networks
      </PageTitle>

      <div>
        <DataTable
          columns={dataTableColumns}
          rows={filteredCustomNetworks}
          noRowsText="No customer networks"
          HeaderComponent={CustomNetworksTableHeader}
          headerProps={{
            count: filteredCustomNetworks.length,
            searchText,
            setSearchText,
            onPeeringInfoClick: () => {
              setOverlayType("peering-info-dialog");
              setIsOverlayOpen(true);
            },
            onDeleteClick: () => {
              setOverlayType("delete-dialog");
              setIsOverlayOpen(true);
            },
            refetchCustomNetworks,
            isFetchingCustomNetworks,
            selectedRows,
            onCreateClick: () => {
              setSelectedRows([]);
              setOverlayType("create-custom-network");
              setIsOverlayOpen(true);
            },
            onModifyClick: () => {
              setOverlayType("modify-custom-network");
              setIsOverlayOpen(true);
            },
          }}
          selectionMode="single"
          selectedRows={selectedRows}
          onRowSelectionChange={setSelectedRows}
          isLoading={isFetchingCustomNetworks}
        />
      </div>

      <FullScreenDrawer
        title="Create Customer Network"
        description="Create a new customer network with the specified details"
        open={isOverlayOpen && ["create-custom-network", "modify-custom-network"].includes(overlayType)}
        closeDrawer={() => setIsOverlayOpen(false)}
        RenderUI={
          <CustomNetworkForm
            formMode={overlayType === "create-custom-network" ? "create" : "modify"}
            regions={regions}
            isFetchingRegions={isFetchingRegions}
            refetchCustomNetworks={refetchCustomNetworks}
            onClose={() => setIsOverlayOpen(false)}
            selectedCustomNetwork={customNetworks.find((customNetwork) => customNetwork.id === selectedRows[0])}
          />
        }
      />

      <TextConfirmationDialog
        open={isOverlayOpen && overlayType === "delete-dialog"}
        handleClose={() => setIsOverlayOpen(false)}
        onConfirm={async () => {
          if (!selectedRows.length) return;
          await deleteCustomNetworkMutation.mutateAsync(selectedRows[0]);
        }}
        title="Delete Customer Network"
        subtitle={`Are you sure you want to delete - ${selectedRows[0]}?`}
        message="To confirm deletion, please enter <b>deleteme</b>, in the field below:"
        isLoading={deleteCustomNetworkMutation.isPending}
      />

      <PeeringInfoDialog
        open={isOverlayOpen && overlayType === "peering-info-dialog"}
        onClose={() => setIsOverlayOpen(false)}
        list={peeringInfoList}
      />
    </PageContainer>
  );
};

export default CustomNetworksPage;

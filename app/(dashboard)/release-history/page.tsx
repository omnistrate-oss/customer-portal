"use client";

import { getServiceMenuItems, getServicePlanMenuItems } from "app/(dashboard)/instances/utils";
import { useEffect, useMemo, useState } from "react";

import { Text } from "components/Typography/Typography";
import ReleaseHistoryIcon from "src/components/Icons/SideNavbar/ReleaseHistory/ReleaseHistoryIcon";
import { useGlobalData } from "src/providers/GlobalDataProvider";

import PageContainer from "../components/Layout/PageContainer";
import PageTitle from "../components/Layout/PageTitle";
import useCustomerVersionSets from "../instances/hooks/useCustomerVersionSets";

import ListOfReleases from "./components/ListOfReleases";

const ReleaseHistoryPage = () => {
  const { serviceOfferings, isFetchingServiceOfferings } = useGlobalData();

  const [searchText, setSearchText] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");

  // Filter serviceOfferings to only include those with VERSION_SET_OVERRIDE feature for CUSTOMER scope
  const versionSetOverrideOfferings = useMemo(() => {
    return serviceOfferings.filter((offering) =>
      offering.productTierFeatures?.some(
        (feature) => feature.feature === "VERSION_SET_OVERRIDE" && feature.scope === "CUSTOMER"
      )
    );
  }, [serviceOfferings]);

  // Build product dropdown options from filtered serviceOfferings
  const productOptions = useMemo(() => {
    return getServiceMenuItems(versionSetOverrideOfferings).map((item) => ({
      label: item.label,
      value: item.value as string,
    }));
  }, [versionSetOverrideOfferings]);

  // Build plan dropdown options filtered by selected product
  const planOptions = useMemo(() => {
    if (!selectedServiceId) return [];
    return getServicePlanMenuItems(versionSetOverrideOfferings, selectedServiceId).map((item) => ({
      label: item.label,
      value: item.value as string,
    }));
  }, [versionSetOverrideOfferings, selectedServiceId]);

  // Auto-select default product (first one) when data loads
  useEffect(() => {
    if (!selectedServiceId && versionSetOverrideOfferings?.length) {
      setSelectedServiceId(versionSetOverrideOfferings[0].serviceId);
    }
  }, [versionSetOverrideOfferings, selectedServiceId]);

  // Auto-select default plan when product changes or plan list updates
  useEffect(() => {
    if (planOptions.length > 0) {
      const currentPlanExists = planOptions.some((p) => p.value === selectedPlanId);
      if (!currentPlanExists) {
        setSelectedPlanId(planOptions[0].value);
      }
    } else {
      setSelectedPlanId("");
    }
  }, [planOptions, selectedPlanId]);

  //fetch product tier versions
  const {
    data: customerVersionSets = [],
    refetch: refetchCustomerVersionSets,
    isFetching: isFetchingReleases,
    isRefetching: isRefetchingReleases,
  } = useCustomerVersionSets(
    {
      serviceId: selectedServiceId,
      productTierId: selectedPlanId,
    },
    { enabled: !!selectedServiceId && !!selectedPlanId }
  );

  // Filter releases based on search
  const filteredReleases = useMemo(() => {
    let filtered = customerVersionSets;

    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(
        (release) =>
          release.version.toLowerCase().includes(lowerSearch) ||
          (release.name?.toLowerCase().includes(lowerSearch) ?? false)
      );
    }

    return filtered;
  }, [searchText, customerVersionSets]);

  const PageReleaseHistoryIcon = () => <ReleaseHistoryIcon color="#17B26A" />;

  return (
    <div>
      <PageContainer>
        <PageTitle icon={PageReleaseHistoryIcon}>Release History</PageTitle>
        <Text size="small" weight="regular" color="#535862" className="mt-1 ml-10">
          View all available versions and release information for products and subscription plans that allow you to
          choose a deployment version
        </Text>
      </PageContainer>

      <ListOfReleases
        releases={filteredReleases}
        searchText={searchText}
        setSearchText={setSearchText}
        selectedProduct={selectedServiceId}
        setSelectedProduct={setSelectedServiceId}
        selectedPlan={selectedPlanId}
        setSelectedPlan={setSelectedPlanId}
        productOptions={productOptions}
        planOptions={planOptions}
        onRefresh={refetchCustomerVersionSets}
        isFetchingProducts={isFetchingServiceOfferings}
        isLoadingReleases={isRefetchingReleases || isFetchingReleases || isFetchingServiceOfferings}
      />
    </div>
  );
};

export default ReleaseHistoryPage;

import { FC } from "react";

import SearchInput from "src/components/DataGrid/SearchInput";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import LoadingSpinner from "src/components/LoadingSpinner/LoadingSpinner";
import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";
import { TierVersionSet } from "src/types/tier-version-set";

import { Option } from "../types";

import FilterSelect from "./FilterSelect";
import ReleaseCard from "./ReleaseCard";

type ListOfReleasesProps = {
  releases: TierVersionSet[];
  searchText: string;
  setSearchText: (text: string) => void;
  selectedProduct: string;
  setSelectedProduct: (value: string) => void;
  selectedPlan: string;
  setSelectedPlan: (value: string) => void;
  productOptions: Option[];
  planOptions: Option[];
  onRefresh: () => void;
  isFetchingProducts?: boolean;
  isLoadingReleases?: boolean;
};

const ListOfReleases: FC<ListOfReleasesProps> = ({
  releases,
  searchText,
  setSearchText,
  selectedProduct,
  setSelectedProduct,
  selectedPlan,
  setSelectedPlan,
  productOptions,
  planOptions,
  onRefresh,
  isFetchingProducts = false,
  isLoadingReleases = false,
}) => {
  return (
    <>
      {/* Header Section */}
      <div className="py-5 px-6 border-b border-gray-200 mt-1">
        <div className="flex items-center justify-between gap-4">
          <DataGridHeaderTitle
            title="List of Releases"
            desc="Displays all supported versions available for the selected product and subscription plan"
            count={releases.length}
            units={{ singular: "release", plural: "releases" }}
          />

          <div className="flex items-center gap-3">
            <SearchInput searchText={searchText} setSearchText={setSearchText} placeholder="Search releases" />

            <RefreshWithToolTip refetch={onRefresh} disabled={isLoadingReleases} />

            <FilterSelect
              id="product-filter"
              value={selectedProduct}
              onChange={(value) => {
                setSelectedProduct(value);
                setSelectedPlan("");
              }}
              placeholder="Select Product"
              options={productOptions}
              isLoading={isFetchingProducts}
              emptyMessage="No Product available"
            />

            <FilterSelect
              id="subscription-plan-filter"
              value={selectedPlan}
              onChange={setSelectedPlan}
              placeholder="Select Subscription Plan"
              options={planOptions}
              disabled={!selectedProduct}
              emptyMessage="No subscription plans found"
            />
          </div>
        </div>
      </div>

      {isLoadingReleases || isFetchingProducts ? (
        <LoadingSpinner />
      ) : !selectedPlan ? (
        <div className="text-center py-12 text-gray-500">No subscription plans found</div>
      ) : releases.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No releases found</div>
      ) : (
        <div className="px-6 py-6 flex flex-col gap-4">
          {releases.map((release) => (
            <ReleaseCard key={release.version} release={release} />
          ))}
        </div>
      )}
    </>
  );
};

export default ListOfReleases;

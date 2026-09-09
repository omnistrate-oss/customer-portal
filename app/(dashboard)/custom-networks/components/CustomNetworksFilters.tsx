import { FC, useCallback, useMemo } from "react";

import DataGridFilter from "src/components/DataGridFilter/DataGridFilter";
import { FilterConfig } from "src/components/DataGridFilter/types";
import { deriveOptionsFromData } from "src/components/DataGridFilter/utils";
import { statuses } from "src/components/StatusChip/StatusChip";
import { cloudProviderLabels } from "src/constants/cloudProviders";
import { SetState } from "src/types/common/reactGenerics";
import { CustomNetwork } from "src/types/customNetwork";
import formatDateUTC from "src/utils/formatDateUTC";

type CustomNetworksFiltersProps = {
  customNetworks: CustomNetwork[];
  setFilteredCustomNetworks: SetState<CustomNetwork[]>;
};

const getStatusLabel = (status = ""): string =>
  statuses[status as keyof typeof statuses] ?? `${status.charAt(0).toUpperCase()}${status.slice(1).toLowerCase()}`;

const CustomNetworksFilters: FC<CustomNetworksFiltersProps> = ({ customNetworks, setFilteredCustomNetworks }) => {
  const filterConfig: FilterConfig<CustomNetwork> = useMemo(
    () => ({
      status: {
        leftMenuLabel: "Status",
        filterType: "multi-select",
        accessor: "status",
        options: deriveOptionsFromData(customNetworks, "status", getStatusLabel),
      },
      "cloud-provider": {
        leftMenuLabel: "Cloud Provider",
        filterType: "multi-select",
        accessor: "cloudProviderName",
        options: deriveOptionsFromData(
          customNetworks,
          "cloudProviderName",
          (provider) => cloudProviderLabels[provider as keyof typeof cloudProviderLabels] ?? provider
        ),
      },
      region: {
        leftMenuLabel: "Region",
        filterType: "multi-select",
        accessor: (network) => network.cloudProviderRegion || "Global",
        options: deriveOptionsFromData(customNetworks, (network) => network.cloudProviderRegion || "Global"),
      },
      "created-by": {
        leftMenuLabel: "Created By",
        filterType: "multi-select",
        accessor: "owningUserName",
        options: deriveOptionsFromData(customNetworks, "owningUserName"),
      },
      "created-on": {
        leftMenuLabel: "Created On",
        filterType: "date-range",
        accessor: "created_at",
      },
    }),
    [customNetworks]
  );

  const getSearchableText = useCallback((network: CustomNetwork) => {
    const provider = network.cloudProviderName;
    return [
      network.id,
      network.name,
      provider,
      cloudProviderLabels[provider as keyof typeof cloudProviderLabels],
      network.cloudProviderRegion || "Global",
      network.cidr,
      network.owningUserName,
      getStatusLabel(network.status),
      formatDateUTC(network.created_at),
      formatDateUTC(network.last_modified_at),
    ].join(" ");
  }, []);

  return (
    <DataGridFilter
      data={customNetworks}
      setFilteredData={setFilteredCustomNetworks}
      filterConfig={filterConfig}
      getSearchableText={getSearchableText}
    />
  );
};

export default CustomNetworksFilters;

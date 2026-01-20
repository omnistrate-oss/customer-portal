import { useMemo } from "react";

import DataGridFilter from "src/components/DataGridFilter/DataGridFilter";
import { FilterConfig } from "src/components/DataGridFilter/types";
import { deriveOptionsFromData } from "src/components/DataGridFilter/utils";
import { statuses } from "src/components/StatusChip/StatusChip";
import { cloudProviderLabelsShort } from "src/constants/cloudProviders";
import { SetState } from "src/types/common/reactGenerics";
import { InstanceSnapshot } from "src/types/instance-snapshot";

type InstanceSnapshotsFiltersProps = {
  snapshots: InstanceSnapshot[];
  setFilteredSnapshots: SetState<InstanceSnapshot[]>;
};

const InstanceSnapshotsFilters: React.FC<InstanceSnapshotsFiltersProps> = ({ snapshots, setFilteredSnapshots }) => {
  const filterConfig: FilterConfig<InstanceSnapshot> = useMemo(
    () => ({
      "snapshot-id": {
        leftMenuLabel: "Snapshot ID",
        filterType: "multi-select",
        accessor: "snapshotId",
        options: deriveOptionsFromData(snapshots, "snapshotId"),
      },
      "product-name": {
        leftMenuLabel: "Product Name",
        filterType: "multi-select",
        accessor: "serviceName",
        options: deriveOptionsFromData(snapshots, "serviceName"),
      },
      "subscription-plan": {
        leftMenuLabel: "Subscription Plan",
        filterType: "multi-select",
        accessor: "productTierName",
        options: deriveOptionsFromData(snapshots, "productTierName"),
      },
      status: {
        leftMenuLabel: "Status",
        filterType: "multi-select",
        accessor: "status",
        options: deriveOptionsFromData(snapshots, "status", (value) => statuses[value] || value),
      },
      "created-on": {
        leftMenuLabel: "Created On",
        filterType: "date-range",
        accessor: "createdTime",
      },
      region: {
        leftMenuLabel: "Region",
        filterType: "multi-select",
        accessor: "region",
        options: deriveOptionsFromData(snapshots, "region", (value) => {
          // Append Cloud Provider to Region
          const snapshot = snapshots.find((snap) => snap.region === value);
          if (snapshot?.cloudProvider) {
            return `${cloudProviderLabelsShort[snapshot.cloudProvider] || snapshot.cloudProvider} - ${value}`;
          }
          return value;
        }),
      },
      "source-instance": {
        leftMenuLabel: "Source Instance",
        filterType: "multi-select",
        accessor: "sourceInstanceId",
        options: deriveOptionsFromData(snapshots, "sourceInstanceId"),
      },
    }),
    [snapshots]
  );

  return <DataGridFilter data={snapshots} setFilteredData={setFilteredSnapshots} filterConfig={filterConfig} />;
};

export default InstanceSnapshotsFilters;

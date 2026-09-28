"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Stack } from "@mui/material";
import useInstances from "app/(dashboard)/instances/hooks/useInstances";

import Button from "src/components/Button/Button";
import LoadingSpinnerSmall from "src/components/CircularProgress/CircularProgress";
import LoadingSpinner from "src/components/LoadingSpinner/LoadingSpinner";
import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";
import { Tab, Tabs } from "src/components/Tab/Tab";
import { DisplayText } from "src/components/Typography/Typography";
import { FlipBackward } from "src/icons";
import { useGlobalData } from "src/providers/GlobalDataProvider";

import PageContainer from "../../components/Layout/PageContainer";
import SnapshotDeploymentParametersTab from "../components/SnapshotDeploymentParametersTab";
import SnapshotDetailsTab from "../components/SnapshotDetailsTab";
import SnapshotMetadataTab from "../components/SnapshotMetadataTab";
import useSnapshotDetail from "../hooks/useSnapshotDetail";

export type CurrentTab = "Snapshot Details" | "Deployment Parameters" | "Snapshot Metadata";

const tabs = {
  snapshotDetails: "Snapshot Details",
  deploymentParameters: "Deployment Parameters",
  snapshotMetadata: "Snapshot Metadata",
} as const;

const baseTabs = [
  { key: "snapshotDetails", value: tabs.snapshotDetails },
  { key: "deploymentParameters", value: tabs.deploymentParameters },
];

const metadataTab = { key: "snapshotMetadata", value: tabs.snapshotMetadata };

const SnapshotDetailPage = ({
  params,
}: {
  params: Promise<{
    snapshotId: string;
  }>;
}) => {
  const { snapshotId } = use(params);

  const [selectedTab, setSelectedTab] = useState<CurrentTab>("Snapshot Details");

  const { subscriptionsObj, isFetchingSubscriptions } = useGlobalData();
  const { data: instances = [] } = useInstances({ onlyInstances: true });

  const snapshotQuery = useSnapshotDetail({ snapshotId });

  const { data: snapshotData, refetch: refetchSnapshot } = snapshotQuery;

  const snapshotMetadata = (snapshotData as { snapshotMetadata?: Record<string, unknown> } | undefined)
    ?.snapshotMetadata;
  const hasSnapshotMetadata = Boolean(snapshotMetadata && Object.keys(snapshotMetadata).length > 0);
  const availableTabs = useMemo(
    () => (hasSnapshotMetadata ? [...baseTabs, metadataTab] : baseTabs),
    [hasSnapshotMetadata]
  );
  // Fall back to the details tab when the snapshot has no metadata to show
  const currentTab = selectedTab === tabs.snapshotMetadata && !hasSnapshotMetadata ? tabs.snapshotDetails : selectedTab;

  // Set Page Title
  useEffect(() => {
    document.title = "Instance Snapshot Details";
  }, [currentTab, snapshotId]);

  if (snapshotQuery.isLoading || isFetchingSubscriptions) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (!snapshotData) {
    return (
      <PageContainer>
        <Stack p={3} pt="150px" alignItems="center" justifyContent="center">
          {/* @ts-expect-error This is a valid prop */}
          <DisplayText size="xsmall" sx={{ wordBreak: "break-word", textAlign: "center", maxWidth: 900 }}>
            Snapshot not found
          </DisplayText>
        </Stack>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Back Button */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Link href="/instance-snapshots">
          <Button startIcon={<FlipBackward />}>Back to list of Instance Snapshots</Button>
        </Link>
      </Stack>

      {/* Tabs */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap="24px" sx={{ marginTop: "20px" }}>
        <Tabs value={currentTab} variant="scrollable" scrollButtons="auto">
          {availableTabs.map(({ key, value }) => (
            <Tab
              data-testid={`${value.replace(/\s+/g, "-").toLowerCase()}-tab`}
              key={key}
              label={value}
              value={value}
              onClick={() => {
                setSelectedTab(value as CurrentTab);
              }}
              disableRipple
            />
          ))}
        </Tabs>

        <Stack direction="row" alignItems="center" gap="16px">
          {!!snapshotQuery.isFetching && <LoadingSpinnerSmall size={20} sx={{ marginLeft: 0 }} />}
          <RefreshWithToolTip disabled={snapshotQuery.isFetching} refetch={refetchSnapshot} />
        </Stack>
      </Stack>

      {currentTab === tabs.snapshotDetails && (
        <SnapshotDetailsTab snapshot={snapshotData} instances={instances} subscriptionsObj={subscriptionsObj} />
      )}
      {currentTab === tabs.deploymentParameters && <SnapshotDeploymentParametersTab snapshot={snapshotData} />}
      {currentTab === tabs.snapshotMetadata && <SnapshotMetadataTab snapshot={snapshotData} />}
    </PageContainer>
  );
};

export default SnapshotDetailPage;

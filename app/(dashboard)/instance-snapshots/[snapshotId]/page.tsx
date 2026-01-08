"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircularProgress, Stack } from "@mui/material";
import useInstances from "app/(dashboard)/instances/hooks/useInstances";
import { RiArrowGoBackFill } from "react-icons/ri";

import Button from "src/components/Button/Button";
import LoadingSpinner from "src/components/LoadingSpinner/LoadingSpinner";
import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";
import { Tab, Tabs } from "src/components/Tab/Tab";
import { DisplayText } from "src/components/Typography/Typography";
import { useGlobalData } from "src/providers/GlobalDataProvider";

import PageContainer from "../../components/Layout/PageContainer";
import SnapshotDeploymentParametersTab from "../components/SnapshotDeploymentParametersTab";
import SnapshotDetailsTab from "../components/SnapshotDetailsTab";
import useSnapshotDetail from "../hooks/useSnapshotDetail";

export type CurrentTab = "Snapshot Details" | "Deployment Parameters";

const tabs = {
  snapshotDetails: "Snapshot Details",
  deploymentParameters: "Deployment Parameters",
};

const SnapshotDetailPage = ({
  params,
}: {
  params: {
    snapshotId: string;
  };
}) => {
  const { snapshotId } = params;

  const [currentTab, setCurrentTab] = useState<CurrentTab>("Snapshot Details");

  // Set Page Title
  useEffect(() => {
    document.title = "Instance Snapshot Details";
  }, [currentTab, snapshotId]);

  const { subscriptionsObj, isFetchingSubscriptions } = useGlobalData();
  const { data: instances = [] } = useInstances({ onlyInstances: true });

  const snapshotQuery = useSnapshotDetail({ snapshotId });

  const { data: snapshotData, refetch: refetchSnapshot } = snapshotQuery;

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
          <Button startIcon={<RiArrowGoBackFill />}>Back to list of Instance Snapshots</Button>
        </Link>
      </Stack>

      {/* Tabs */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap="24px" sx={{ marginTop: "20px" }}>
        <Tabs value={currentTab} variant="scrollable" scrollButtons="auto">
          {Object.entries(tabs).map(([key, value]) => (
            <Tab
              data-testid={`${value.replace(" ", "-").toLowerCase()}-tab`}
              key={key}
              label={value}
              value={value}
              onClick={() => {
                setCurrentTab(value as CurrentTab);
              }}
              disableRipple
            />
          ))}
        </Tabs>

        <Stack direction="row" alignItems="center" gap="16px">
          {snapshotQuery.isFetching && <CircularProgress size={20} />}
          <RefreshWithToolTip disabled={snapshotQuery.isFetching} refetch={refetchSnapshot} />
        </Stack>
      </Stack>

      {currentTab === tabs.snapshotDetails && (
        <SnapshotDetailsTab snapshot={snapshotData} instances={instances} subscriptionsObj={subscriptionsObj} />
      )}
      {currentTab === tabs.deploymentParameters && <SnapshotDeploymentParametersTab snapshot={snapshotData} />}
    </PageContainer>
  );
};

export default SnapshotDetailPage;

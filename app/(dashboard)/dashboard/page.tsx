"use client";

import LoadingSpinner from "src/components/LoadingSpinner/LoadingSpinner";
import { useGlobalData } from "src/providers/GlobalDataProvider";

import useAuditLogs from "../audit-logs/hooks/useAuditLogs";
import EventsTable from "../components/EventsTable/EventsTable";
import DashboardIcon from "../components/Icons/DashboardIcon";
import PageContainer from "../components/Layout/PageContainer";
import PageTitle from "../components/Layout/PageTitle";
import useInstances from "../instances/hooks/useInstances";

import DeploymentsByAgeChart from "./charts/DeploymentsByAgeChart";
import DeploymentsByLoadChart from "./charts/DeploymentsByLoadChart";
import HealthStatusChart from "./charts/HealthStatusChart";
import LifecycleStatusChart from "./charts/LifecycleStatusChart";
import ChartCard from "./components/ChartCard";
import ClusterLocations from "./components/ClusterLocations";
import DashboardLogsTableHeader from "./components/DashboardLogsTableHeader";

const DashboardPage = () => {
  const { isFetchingSubscriptions } = useGlobalData();
  const { data: instances = [], isPending: isInstancesPending } = useInstances({ onlyInstances: true });

  const { data: dashboardLogs, isFetching: isFetchingDashboardLogs } = useAuditLogs({
    pageSize: 5,
    eventSourceTypes: "Customer",
  });

  return (
    <PageContainer>
      <PageTitle icon={DashboardIcon} className="mb-6">
        Dashboard
      </PageTitle>

      <ClusterLocations resourceInstances={instances} isFetchingInstances={isInstancesPending} />

      <div className="mt-8">
        <EventsTable
          HeaderComponent={DashboardLogsTableHeader}
          HeaderProps={{}}
          columns={[
            "expand",
            "deploymentId",
            "serviceName",
            "resourceType",
            "time",
            "message",
            "user",
            "subscriptionPlan",
            "subscriptionOwner",
            "userAgent",
          ]}
          data={dashboardLogs}
          fetchNextPage={() => {}}
          hasNextPage={false}
          isFetchingNextPage={false}
          isLoading={isFetchingDashboardLogs || isFetchingSubscriptions}
          pageIndex={0}
          setPageIndex={() => {}}
          showPagination={false}
          minHeight={290}
          noRowsText="No audit logs"
        />
      </div>

      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        <ChartCard title="Deployments by Lifecycle Stage">
          {isInstancesPending ? <LoadingSpinner /> : <LifecycleStatusChart instances={instances} />}
        </ChartCard>

        <ChartCard title="Deployments by Health Status">
          {isInstancesPending ? <LoadingSpinner /> : <HealthStatusChart instances={instances} />}
        </ChartCard>
        <ChartCard title="Deployments by System Load">
          {isInstancesPending ? <LoadingSpinner /> : <DeploymentsByLoadChart instances={instances} />}
        </ChartCard>
      </div>

      <div className="mt-8">
        <ChartCard title="Deployments by Month – Last 12 Months" className="lg:col-span-2">
          {isInstancesPending ? <LoadingSpinner /> : <DeploymentsByAgeChart instances={instances} />}
        </ChartCard>
      </div>
    </PageContainer>
  );
};

export default DashboardPage;

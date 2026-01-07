"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Collapse } from "@mui/material";
import useBillingStatus from "app/(dashboard)/billing/hooks/useBillingStatus";
import clsx from "clsx";

import { useGlobalData } from "src/providers/GlobalDataProvider";
import { colors } from "src/themeConfig";
import {
  getAccessControlRoute,
  getBillingRoute,
  getCloudAccountsRoute,
  getCostExplorerRoute,
  getCustomNetworksRoute,
  getEventsRoute,
  getInstanceSnapshotsRoute,
  getInstancesRoute,
  getNotificationsRoute,
  getSettingsRoute,
  getSnapshotDetailsRoute,
  getSubscriptionsRoute,
} from "src/utils/routes";
import APIDocsIcon from "components/Icons/SideNavbar/APIDocs/APIDocsIcon";
import DashboardNavIcon from "components/Icons/SideNavbar/Dashboard/Dashboard";
import DeveloperDocsIcon from "components/Icons/SideNavbar/DeveloperDocs/DeveloperDocsIcon";
import DownloadCLIIcon from "components/Icons/SideNavbar/DownloadCLI/DownloadCLIIcon";
import FileLockIcon from "components/Icons/SideNavbar/FileLock/FileLockIcon";
import PricingIcon from "components/Icons/SideNavbar/Pricing/PricingIcon";
import ResourcesIcon from "components/Icons/SideNavbar/Resources/Resources";
import ShieldIcon from "components/Icons/SideNavbar/Shield/Shield";
import SupportIcon from "components/Icons/SideNavbar/Support/SupportIcon";
import { Text } from "components/Typography/Typography";

import FullScreenDrawer from "../FullScreenDrawer/FullScreenDrawer";

import PlanDetails from "./PlanDetails";

const SingleNavItem = ({
  name,
  icon: Icon,
  href,
  currentPath,
  onClick,
}: {
  name: string;
  icon: any;
  href?: string;
  currentPath: string | null;
  onClick?: () => void;
}) => {
  if (href) {
    return (
      <Link
        href={href}
        className="flex items-center gap-2.5 py-2.5 px-3 rounded-md group cursor-pointer hover:bg-gray-50 transition-colors mb-1 select-none"
      >
        <Icon />

        <Text
          size="medium"
          weight="semibold"
          color={currentPath === href ? colors.success500 : colors.gray700}
          className="group-hover:text-success-500 transition-colors"
        >
          {name}
        </Text>
      </Link>
    );
  }

  return (
    <div
      className="flex items-center gap-2.5 py-2.5 px-3 rounded-md group cursor-pointer hover:bg-gray-50 transition-colors mb-1"
      onClick={onClick}
    >
      <Icon />

      <Text size="medium" weight="semibold" className="group-hover:text-success-500 transition-colors select-none">
        {name}
      </Text>
    </div>
  );
};

const ExpandibleNavItem = ({ name, icon: Icon, subItems, isExpanded, setExpandedMenus, currentPath }) => {
  return (
    <div>
      <div
        className="flex items-center gap-2.5 py-2.5 px-3 rounded-md group cursor-pointer hover:bg-gray-50 transition-colors mb-1"
        onClick={() =>
          setExpandedMenus((prev) => ({
            ...prev,
            [name]: !prev[name],
          }))
        }
      >
        <Icon />

        <Text size="medium" weight="semibold" className="group-hover:text-success-500 transition-colors select-none">
          {name}
        </Text>

        <div className="ml-auto">
          <ExpandLessIcon
            sx={{ color: colors.gray400 }}
            className={`transition-all ${isExpanded ? "rotate-0" : "rotate-180"}`}
          />
        </div>
      </div>

      <Collapse in={isExpanded}>
        {subItems.map((item) =>
          item.isHidden ? null : (
            <Link
              href={item.href}
              key={item.name}
              className={clsx(
                "flex items-center gap-2.5 py-2.5 px-3 pl-10 rounded-md group cursor-pointer hover:bg-gray-50 transition-colors mb- select-none",
                currentPath?.startsWith(item.href) && "bg-gray-50"
              )}
            >
              <div className="w-2 h-2 rounded-full bg-success-500" />
              <Text
                size="medium"
                weight="semibold"
                color={currentPath?.startsWith(item.href) ? colors.success500 : colors.gray700}
                className="group-hover:text-success-500 transition-colors"
              >
                {item.name}
              </Text>
            </Link>
          )
        )}
      </Collapse>
    </div>
  );
};

type Overlay = "plan-details" | "documentation" | "pricing" | "support" | "api-documentation";

const Sidebar = () => {
  const currentPath = usePathname();
  const { serviceOfferings } = useGlobalData();
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [overlayType, setOverlayType] = useState<Overlay>("plan-details");
  const [expandedMenus, setExpandedMenus] = useState({
    Deployments: false,
    "Governance Hub": false,
    "Account Management": false,
  });

  useEffect(() => {
    if (currentPath) {
      setExpandedMenus((prev) => ({
        ...prev,
        Deployments:
          [getCustomNetworksRoute({}), getCloudAccountsRoute({}), getInstanceSnapshotsRoute()].includes(currentPath) ||
          currentPath.startsWith("/instances") ||
          currentPath.startsWith(getSnapshotDetailsRoute("")),
        "Governance Hub": [getAccessControlRoute(), getEventsRoute(), getNotificationsRoute()].includes(currentPath),
        "Account Management": [
          getSettingsRoute(),
          getBillingRoute(),
          getCostExplorerRoute(),
          getSubscriptionsRoute({}),
        ].includes(currentPath),
      }));
    }
  }, [currentPath]);

  const showCloudProvidersPage = useMemo(() => {
    return Boolean(
      serviceOfferings.find(
        (offering) => offering.serviceModelType === "BYOA" || offering.serviceModelType === "ON_PREM_COPILOT"
      )
    );
  }, [serviceOfferings]);

  const showCustomNetworksPage = useMemo(() => {
    return Boolean(
      serviceOfferings.some((offering) => offering.serviceModelFeatures?.find((el) => el.feature === "CUSTOM_NETWORKS"))
    );
  }, [serviceOfferings]);

  // Prefetch Billing Data
  const billingStatusQuery = useBillingStatus();

  const isBillingEnabled = Boolean(billingStatusQuery.data?.enabled);

  const bottomItems = useMemo(
    () => [
      {
        name: "API Documentation",
        icon: APIDocsIcon,
        onClick: () => {
          setIsOverlayOpen(true);
          setOverlayType("api-documentation");
        },
      },
      {
        name: "Download CLI",
        icon: DownloadCLIIcon,
        onClick: () => {
          setIsOverlayOpen(true);
          setOverlayType("plan-details");
        },
      },
      {
        name: "Support",
        icon: SupportIcon,
        onClick: () => {
          setIsOverlayOpen(true);
          setOverlayType("support");
        },
      },
      {
        name: "Pricing",
        icon: PricingIcon,
        onClick: () => {
          setIsOverlayOpen(true);
          setOverlayType("pricing");
        },
      },
      {
        name: "Documentation",
        icon: DeveloperDocsIcon,
        onClick: () => {
          setIsOverlayOpen(true);
          setOverlayType("documentation");
        },
      },
    ],
    []
  );

  const topItems = useMemo(() => {
    return [
      {
        name: "Dashboard",
        icon: DashboardNavIcon,
        href: "/dashboard",
      },
      {
        name: "Deployments",
        icon: ResourcesIcon,
        isExpandible: true,
        subItems: [
          { name: "Instances", href: getInstancesRoute() },
          { name: "Instance Snapshots", href: getInstanceSnapshotsRoute() },
          {
            name: "Customer Networks",
            href: getCustomNetworksRoute({}),
            isHidden: !showCustomNetworksPage,
          },
          {
            name: "Cloud Accounts",
            href: getCloudAccountsRoute({}),
            isHidden: !showCloudProvidersPage,
          },
        ],
      },
      {
        name: "Governance Hub",
        icon: ShieldIcon,
        isExpandible: true,
        subItems: [
          { name: "Access Control", href: getAccessControlRoute() },
          { name: "Audit Logs", href: getEventsRoute() },
          { name: "Alerts", href: getNotificationsRoute() },
        ],
      },
      {
        name: "Account Management",
        icon: FileLockIcon,
        isExpandible: true,
        subItems: [
          { name: "Settings", href: getSettingsRoute() },
          {
            name: "Billing",
            href: getBillingRoute(),
            isHidden: !isBillingEnabled,
          },
          {
            name: "Cost Explorer",
            href: getCostExplorerRoute(),
            isHidden: !isBillingEnabled,
          },
          { name: "Subscriptions", href: getSubscriptionsRoute({}) },
        ],
      },
    ];
  }, [isBillingEnabled, showCloudProvidersPage, showCustomNetworksPage]);

  return (
    <aside
      className="absolute left-0 top-0 bottom-0 overflow-auto flex flex-col justify-between gap-12 px-4 py-5 border-r border-[#E9EAEB] shadow-[0_1px_2px_0_#0A0D120D] bg-white w-[19rem]"
      style={{
        // Hide scrollbar
        scrollbarWidth: "none",
      }}
    >
      <div>
        {topItems.map((item) =>
          item.subItems ? (
            <ExpandibleNavItem
              key={item.name}
              currentPath={currentPath}
              isExpanded={expandedMenus[item.name]}
              setExpandedMenus={setExpandedMenus}
              {...item}
            />
          ) : (
            <SingleNavItem key={item.name} currentPath={currentPath} {...item} />
          )
        )}
      </div>
      <div>
        {bottomItems.map((item) => (
          <SingleNavItem key={item.name} currentPath={currentPath} {...item} />
        ))}
      </div>

      <FullScreenDrawer
        open={isOverlayOpen}
        closeDrawer={() => setIsOverlayOpen(false)}
        title="Plan Details"
        description="View the details of the selected plan"
        RenderUI={<PlanDetails startingTab={overlayType} />}
      />
    </aside>
  );
};

export default Sidebar;

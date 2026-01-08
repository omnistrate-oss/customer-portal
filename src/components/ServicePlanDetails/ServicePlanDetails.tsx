"use client";

import { useState } from "react";
import { Tab, Tabs } from "@mui/material";
import DOMPurify from "isomorphic-dompurify";

import useDownloadCLI from "src/hooks/useDownloadCLI";
import { colors } from "src/themeConfig";
import { ServiceOffering } from "src/types/serviceOffering";

import APIDocumentation from "../APIDocumentation/APIDocumentation";
import Button from "../Button/Button";
import CardWithTitle from "../Card/CardWithTitle";
import LoadingSpinnerSmall from "../CircularProgress/CircularProgress";

type CurrentTab = "plan-details" | "documentation" | "pricing" | "support" | "api-documentation" | "download-cli";

type ServicePlanDetailsProps = {
  serviceOffering?: ServiceOffering;
  startingTab?: CurrentTab;
};

const tabLabels = {
  "plan-details": "Plan Details",
  documentation: "Documentation",
  pricing: "Pricing",
  support: "Support",
  "api-documentation": "API Documentation",
};

const ServicePlanDetails: React.FC<ServicePlanDetailsProps> = ({ serviceOffering, startingTab = "plan-details" }) => {
  const { downloadCLI, isDownloading } = useDownloadCLI();
  const [currentTab, setCurrentTab] = useState<CurrentTab>(startingTab);

  if (!serviceOffering) return null;

  const actionButton = (
    <Button
      variant="outlined"
      disabled={isDownloading}
      onClick={() => {
        downloadCLI(serviceOffering.serviceId, serviceOffering.serviceAPIID);
      }}
    >
      Download CLI
      {isDownloading && <LoadingSpinnerSmall />}
    </Button>
  );

  return (
    <CardWithTitle title={serviceOffering.productTierName} actionButton={actionButton}>
      <Tabs
        value={currentTab}
        centered
        sx={{
          mb: "32px",
          borderBottom: "1px solid #E9EAEB",
          "& .MuiTabs-indicator": {
            backgroundColor: colors.purple700,
          },
        }}
      >
        {Object.keys(tabLabels).map((tab) => (
          <Tab
            key={tab}
            disabled={tab === "download-cli" && isDownloading}
            label={tabLabels[tab]}
            value={tab}
            onClick={() => {
              setCurrentTab(tab as CurrentTab);
            }}
            sx={{
              paddingY: "12px !important",
              paddingX: "16px !important",
              minWidth: "0px",
              textTransform: "none",
              fontWeight: "600",
              color: "#717680",
              "&.Mui-selected": {
                color: colors.purple700,
              },
            }}
          />
        ))}
      </Tabs>

      {["plan-details", "documentation", "pricing", "support"].includes(currentTab) && (
        <CardWithTitle title={tabLabels[currentTab]} style={{ minHeight: "500px" }}>
          <div className="ql-snow">
            <div
              className={"ql-editor"}
              style={{ wordBreak: "break-word" }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  currentTab === "plan-details"
                    ? serviceOffering.productTierPlanDescription
                    : currentTab === "documentation"
                      ? serviceOffering.productTierDocumentation
                      : currentTab === "pricing"
                        ? // @ts-ignore
                          serviceOffering.productTierPricing?.value
                        : currentTab === "support"
                          ? serviceOffering.productTierSupport
                          : ""
                ),
              }}
            />
          </div>
        </CardWithTitle>
      )}

      {currentTab === "api-documentation" && (
        <APIDocumentation serviceId={serviceOffering.serviceId} serviceAPIID={serviceOffering.serviceAPIID} />
      )}
    </CardWithTitle>
  );
};

export default ServicePlanDetails;

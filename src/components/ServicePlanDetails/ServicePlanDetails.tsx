"use client";

import { Box, Stack, Tab, Tabs } from "@mui/material";
import DOMPurify from "isomorphic-dompurify";
import { useState } from "react";

import useDownloadCLI from "src/hooks/useDownloadCLI";
import { colors } from "src/themeConfig";
import { ServiceOffering } from "src/types/serviceOffering";

import APIDocumentation from "../APIDocumentation/APIDocumentation";
import Button from "../Button/Button";
import CardWithTitle from "../Card/CardWithTitle";
import LoadingSpinnerSmall from "../CircularProgress/CircularProgress";
import DownloadCLIIcon from "../Icons/SideNavbar/DownloadCLI/DownloadCLIIcon";
import DownloadCLITitleIcon from "../Icons/SideNavbar/DownloadCLI/DownloadCLITitleIcon";
import { DisplayText, Text } from "../Typography/Typography";

type CurrentTab = "plan-details" | "documentation" | "pricing" | "support" | "api-documentation" | "download-cli";

type ServicePlanDetailsProps = {
  serviceOffering?: ServiceOffering;
  startingTab?: CurrentTab;
};

const tabLabels: Record<CurrentTab, string> = {
  "plan-details": "Plan Details",
  documentation: "Documentation",
  pricing: "Pricing",
  support: "Support",
  "api-documentation": "API Documentation",
  "download-cli": "Download CLI",
};

const ServicePlanDetails: React.FC<ServicePlanDetailsProps> = ({ serviceOffering, startingTab = "plan-details" }) => {
  const { downloadCLI, isDownloading } = useDownloadCLI();
  const [currentTab, setCurrentTab] = useState<CurrentTab>(startingTab);

  if (!serviceOffering) return null;

  return (
    <CardWithTitle title={serviceOffering.productTierName}>
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
        {(Object.keys(tabLabels) as CurrentTab[]).map((tab) => (
          <Tab
            key={tab}
            disabled={tab === "download-cli" && isDownloading}
            label={tabLabels[tab]}
            value={tab}
            onClick={() => {
              setCurrentTab(tab);
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

      {currentTab === "download-cli" && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
          sx={{ border: "1px solid #E9EAEB", borderRadius: "12px", p: 2 }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box
              sx={{
                p: 1,
                border: "1px solid #E9EAEB",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                marginTop: "-20px",
              }}
            >
              <DownloadCLITitleIcon color={colors.success500} />
            </Box>
            <Box flex={"columns"}>
              {/* @ts-ignore */}
              <DisplayText size="xsmall" weight="bold" color="#181D27">
                Download CLI
              </DisplayText>
              <Text size="small" weight="regular" color="#535862">
                Supported platform:<b> Linux ARM64</b> 
              </Text>
            </Box>
          </Stack>
          <Button
            variant="contained"
            disabled={isDownloading}
            onClick={() => {
              downloadCLI(serviceOffering.serviceId, serviceOffering.serviceAPIID);
            }}
            startIcon={<DownloadCLIIcon color="#FFFFFF" />}
          >
            Download CLI
            {isDownloading && <LoadingSpinnerSmall />}
          </Button>
        </Stack>
      )}
    </CardWithTitle>
  );
};

export default ServicePlanDetails;

import { Box, styled } from "@mui/material";
import * as DOMPurify from "dompurify";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import servicePlanIcons from "../../../public/assets/images/dashboard/service/latest_icons/service_env.svg";
import Tooltip from "..//Tooltip/Tooltip";
import MarketplaceServiceDefinitionsTab, {
  tabs,
} from "../Tab/MarketplaceServiceDefinitionsTab";
import { DisplayText } from "../Typography/Typography";

export const AccessSupport = (props) => {
  const { service, currentTabValue } = props;
  const [currentTab, setCurrentTab] = useState(tabs.description);
  useEffect(() => {
    if (currentTabValue) {
      setCurrentTab(currentTabValue);
    }
  }, [currentTabValue]);

  return (
    <Box
      width={"100%"}
      sx={{
        p: 2.5,
        minHeight: "200px",
        borderBottom: 0,
        borderRadius: 2,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        justifyContent: "space-between",
      }}
    >
      <Box display="flex" justifyContent="space-between" mt="14px">
        {/* <Image src={servicePlanMainIcons} alt="image-icon" /> */}
        <Logo
          src={
            service?.serviceLogoURL ? service?.serviceLogoURL : servicePlanIcons
          }
          height={40}
          width={40}
          alt="service-icon"
        />
        <Box flexGrow={1} ml="14px">
          <Tooltip placement="bottom" title={service?.serviceName}>
            <DisplayText
              size="small"
              weight="semibold"
              sx={{
                width: "400px",
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {service?.serviceName}
            </DisplayText>
          </Tooltip>
        </Box>
        <Box alignSelf="flex-end" sx={{ textAlign: "right" }}></Box>
        <Box></Box>
      </Box>
      <Box mt="40px">
        <MarketplaceServiceDefinitionsTab
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />
      </Box>
      <Box sx={{ minHeight: "400px" }}>
        {currentTab === tabs.description && (
          <Box mt="40px" key={currentTab}>
            <Box className={"ql-snow"}>
              <Box
                className={"ql-editor"}
                sx={{ wordBreak: "break-word" }}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    service?.productTierPlanDescription
                  ),
                }}
              ></Box>
            </Box>
          </Box>
        )}
        {currentTab === tabs.documentation && (
          <Box mt="40px" key={currentTab}>
            <Box className={"ql-snow"}>
              <Box
                className={"ql-editor"}
                sx={{ wordBreak: "break-word" }}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(service?.productTierDocumentation),
                }}
              ></Box>
            </Box>
          </Box>
        )}
        {currentTab === tabs.pricing && (
          <Box mt="40px" key={currentTab}>
            <Box className={"ql-snow"}>
              <Box
                className={"ql-editor"}
                sx={{ wordBreak: "break-word" }}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    service?.productTierPricing?.value
                  ),
                }}
              ></Box>
            </Box>
          </Box>
        )}
        {currentTab === tabs.support && (
          <Box mt="40px" key={currentTab}>
            <Box className={"ql-snow"}>
              <Box
                className={"ql-editor"}
                sx={{ wordBreak: "break-word" }}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(service?.productTierSupport),
                }}
              ></Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const Logo = styled(Image)({
  height: 40,
  width: 40,
});

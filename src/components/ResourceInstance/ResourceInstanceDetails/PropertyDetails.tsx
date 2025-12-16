import { FC, ReactNode, useState } from "react";
import NextLink from "next/link";
import { Box, BoxProps, Stack, styled } from "@mui/material";

import CopyButton from "src/components/Button/CopyButton";
import { PasswordWithOutBorderField } from "src/components/FormElementsv2/PasswordField/PasswordWithOutBorderField";
import ArrayIcon from "src/components/Icons/RestoreInstance/ArrayIcon";
import JsonIcon from "src/components/Icons/RestoreInstance/JsonIcon";
import StatusChip from "src/components/StatusChip/StatusChip";
import Tooltip from "src/components/Tooltip/Tooltip";
import { Text } from "src/components/Typography/Typography";
import { cloudProviderLongLogoMap } from "src/constants/cloudProviders";
import { getResourceInstanceDetailsStatusStylesAndLabel } from "src/constants/statusChipStyles/resourceInstanceDetailsStatus";

import JSONViewModal from "./JSONViewModal";
import ResourceInstanceDialog from "./ResourceInstanceDialog";

export type Row = {
  dataTestId?: string;
  label: string;
  description?: string;
  value: any;
  valueType?:
    | "custom"
    | "text"
    | "link-box"
    | "link"
    | "password"
    | "boolean"
    | "Password"
    | "Boolean"
    | "String"
    | "string"
    | "float64"
    | "Float64"
    | "Secret"
    | "secret"
    | "array"
    | "json"
    | "cloudProvider"
    | "JSON"
    | "download"
    | "Any";
  linkProps?: {
    href: string;
    target?: "_blank" | "_self";
  };
};

type License = {
  ID: string;
  CreationTime: string;
  ExpirationTime: string;
  Description: string;
  InstanceID: string;
  SubscriptionID: string;
  ProductPlanUniqueID: string;
  OrganizationID: string;
  Version: number;
};

const textType = ["String", "string", "text", "float64", "Float64", "Secret", "secret"];

type PropertyTableProps = {
  rows: { rows: Row[]; title: string; desc: string; flexWrap: boolean };
} & BoxProps;

interface JsonDataType {
  [key: string]: unknown;
}

const Link = styled(NextLink)({
  color: "#535862",
  fontWeight: 500,
  fontSize: "14px",
  lineHeight: "20px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "inline-block",
  textDecoration: "underline",
  textUnderlineOffset: "3px",
  "&:hover": {
    color: "#099250",
  },
});

type ConatainerCardProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  contentBoxProps?: BoxProps;
  statusChip?: ReactNode;
};

export const ContainerCard: FC<ConatainerCardProps & BoxProps> = (props) => {
  const { title, description, children, statusChip, contentBoxProps = {}, ...restProps } = props;

  return (
    <Box borderRadius="8px" border="1px solid #E9EAEB" boxShadow="0px 1px 2px 0px #0A0D120D" {...restProps}>
      <Stack
        sx={{
          flexDirection: "column",
          justifyContent: "space-between",
          borderBottom: "1px solid #E4E7EC",
        }}
        alignItems="left"
        padding="20px 24px"
      >
        <Box display="flex" alignItems="center" gap="8px">
          <Text size="small" weight="bold" color="#7F56D9">
            {title}
          </Text>

          {statusChip && statusChip}
        </Box>
        <Text size="small" weight="regular" color="#535862" marginTop="2px">
          {description}
        </Text>
      </Stack>
      <Box {...contentBoxProps}>{children}</Box>
    </Box>
  );
};

const PropertyDetails: FC<PropertyTableProps> = ({ rows, ...otherProps }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [data, setData] = useState<Row | null>(null);
  const [jsonViewModalOpen, setJsonViewModalOpen] = useState(false);
  const [jsonData, setJsonData] = useState<object | null>(null);

  function handleDialogClose() {
    setIsDialogOpen(false);
  }

  return (
    <ContainerCard title={rows.title} description={rows.desc} {...otherProps}>
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fit, minmax(220px, 1fr))"
        position={"relative"}
        padding="12px 0"
        rowGap="12px"
      >
        <Box position={"absolute"} right={0} height={"100%"} width={"2px"} bgcolor={"white"} bottom={5} />

        {rows?.rows?.map((row, index) => {
          const valueType = row.valueType || "text";
          let { value } = row;

          //check for JSON data types
          let isJSONData = false;
          let jsonData: JsonDataType;

          if (value !== null && value !== undefined && typeof value === "object" && valueType !== "custom") {
            try {
              if (value.constructor === {}.constructor) {
                jsonData = value;
                isJSONData = true;
              }
              //eslint-disable-next-line
            } catch (err) {}
          }

          if (typeof value === "string") {
            try {
              const parsed = JSON.parse(value);
              if (typeof parsed === "object") {
                jsonData = parsed;
                isJSONData = true;
              }

              //eslint-disable-next-line
            } catch (error) {}
          }

          if (!row.value) {
            value = null;
          } else if (valueType === "download") {
            value = (
              <>
                <Box
                  sx={{
                    fontWeight: 600,
                    fontSize: "14px",
                    lineHeight: "20px",
                    color: "#6941C6",
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                    textDecorationThickness: "1px",
                  }}
                  onClick={() => {
                    const licenseData = row.value;
                    let parsedData: Record<string, unknown> = {};
                    let instanceID = "file";

                    if (typeof licenseData === "string") {
                      try {
                        parsedData = JSON.parse(licenseData) as Record<string, any>;
                        const license: License = parsedData?.License as License;
                        instanceID = license?.InstanceID ?? instanceID;
                      } catch (error) {
                        console.error("Invalid JSON:", error);
                      }
                    } else if (licenseData && typeof licenseData === "object") {
                      parsedData = licenseData as Record<string, any>;
                      const license: License = parsedData?.License as License;
                      instanceID = license?.InstanceID ?? instanceID;
                    }
                    const data = typeof licenseData === "string" ? licenseData : JSON.stringify(licenseData, null, 2);
                    const blob = new Blob([data], {
                      type: "text/plain",
                    });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `${instanceID}.txt`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                >
                  {"Click Here to download"}
                </Box>
              </>
            );
          } else if (isJSONData) {
            value = (
              <>
                {valueType === "array" ? <ArrayIcon /> : <JsonIcon />}

                <Box
                  sx={{
                    fontWeight: 600,
                    fontSize: "14px",
                    lineHeight: "20px",
                    color: "#6941C6",
                    cursor: "pointer",
                    marginLeft: "3px",
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    setJsonViewModalOpen(true);
                    setData(row);
                    setJsonData(jsonData);
                  }}
                >
                  {"Click here to view"}
                </Box>
              </>
            );
          } else if (textType.includes(valueType)) {
            value = (
              <>
                <Tooltip title={row.value}>
                  <Box maxWidth="calc(100% - 36px)">
                    <Text ellipsis size="small" weight="medium" color="#535862">
                      {row.value ? row.value : "-"}
                    </Text>
                  </Box>
                </Tooltip>
                <CopyButton
                  text={row.value}
                  iconProps={{ color: "#6941C6", width: 20, height: 20 }}
                  iconStyle={{ flexShrink: 0 }}
                />
              </>
            );
          } else if (valueType === "link") {
            value = (
              <>
                <Link href={row.linkProps?.href || "#"} target={row.linkProps?.target || "_self"}>
                  {row.value}
                </Link>
                <CopyButton
                  text={row.value}
                  iconProps={{ color: "#6941C6", width: 20, height: 20 }}
                  iconStyle={{ flexShrink: 0 }}
                />
              </>
            );
          } else if (valueType === "link-box") {
            value = (
              <>
                <Text size="small" weight="regular" color="#6941C6" ellipsis sx={{ flex: 1, wordBreak: "break-word" }}>
                  {row.value}
                </Text>
                <CopyButton
                  text={row.value}
                  iconProps={{ color: "#6941C6", width: 20, height: 20 }}
                  iconStyle={{ flexShrink: 0 }}
                />
              </>
            );
          } else if (valueType === "boolean" || valueType === "Boolean") {
            const statusStylesAndMap = getResourceInstanceDetailsStatusStylesAndLabel(row.value);
            value = <StatusChip {...statusStylesAndMap} />;
          } else if (valueType === "password" || valueType === "Password") {
            value = (
              <>
                <PasswordWithOutBorderField>{row.value}</PasswordWithOutBorderField>
                <CopyButton
                  text={row.value}
                  iconProps={{
                    color: "#6941C6",
                    width: 20,
                    height: 20,
                  }}
                  iconStyle={{ flexShrink: 0 }}
                  iconButtonProps={{ p: 0 }}
                />
              </>
            );
          } else if (valueType === "cloudProvider") {
            value = row.value ? cloudProviderLongLogoMap[row.value] : "-";
          } else {
            // Custom value type
            value = (
              <Box
                display={"flex"}
                justifyContent={"center"}
                textAlign={"center"}
                sx={{ textOverflow: "ellipsis", overflow: "hidden" }}
              >
                {row.value}
              </Box>
            );
          }

          return (
            <Box
              data-testid={row.dataTestId || ""}
              key={index}
              p="4px 24px 14px 24px"
              display="flex"
              flexDirection="column"
              alignItems="flex-start"
              borderRight="1px solid #EAECF0"
              boxSizing="border-box"
              minHeight="80px"
              // border="1px solid blue"
            >
              <Tooltip title={row.label}>
                <Box maxWidth="100%">
                  <Text ellipsis size="xsmall" weight="semibold" color="#414651">
                    {row.label}
                  </Text>
                </Box>
              </Tooltip>
              <Box flex="1 1 auto" display="flex" alignItems="center" maxWidth="100%">
                {value ? value : "-"}
              </Box>
            </Box>
          );
        })}
      </Box>
      <ResourceInstanceDialog
        open={isDialogOpen}
        handleClose={handleDialogClose}
        variant={data?.valueType}
        data={data?.value}
        title={data?.label}
        subtitle={data?.description}
      />

      <JSONViewModal
        open={jsonViewModalOpen}
        handleClose={() => {
          setJsonViewModalOpen(false);
        }}
        parameterName={data?.label}
        parameterDescription={data?.description}
        jsonData={jsonData}
      />
    </ContainerCard>
  );
};

export default PropertyDetails;

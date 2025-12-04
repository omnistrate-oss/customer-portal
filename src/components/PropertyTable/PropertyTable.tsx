import { FC, Fragment } from "react";
import Link from "next/link";
import { Box } from "@mui/material";

import CopyButton from "../Button/CopyButton";
import Tooltip from "../Tooltip/Tooltip";
import { Text } from "../Typography/Typography";

export type Row = {
  label: string;
  description?: string;
  value: any;
  valueType?: "custom" | "text" | "link-box" | "link";
  linkProps?: {
    href: string;
    target?: "_blank" | "_self";
  };
};

type PropertyTableProps = {
  rows: Row[];
};

const PropertyTable: FC<PropertyTableProps> = ({ rows }) => {
  return (
    <Box
      borderRadius="12px"
      border="1px solid #EAECF0"
      boxShadow="inset 0px 1px 2px 0px #1018280F, 0px 1px 3px 0px #1018281A"
      display="grid"
      gridTemplateColumns="2fr 3fr"
      mt="24px"
    >
      {rows.map((row, index) => {
        const valueType = row.valueType || "text";
        let value;

        if (!row.value) {
          value = null;
        } else if (valueType === "text") {
          value = (
            <Text
              size="small"
              weight="semibold"
              color="#667085"
              sx={{
                wordBreak: "break-word",
              }}
            >
              {row.value.slice(0, 100)}
              {row.value.length > 100 && "..."}
            </Text>
          );
        } else if (valueType === "link") {
          value = (
            <Link
              href={row.linkProps?.href || "#"}
              target={row.linkProps?.target || "_self"}
              style={{
                fontWeight: 600,
                fontSize: "14px",
                lineHeight: "20px",
                color: "#7F56D9",
                wordBreak: "break-word",
              }}
            >
              {row.value.slice(0, 100)}
              {row.value.length > 100 && "..."}
            </Link>
          );
        } else if (valueType === "link-box") {
          value = (
            <Box
              m="16px 24px"
              p="8px 16px"
              border="2px solid #7F56D9"
              borderRadius="12px"
              sx={{ backgroundColor: "#F9F5FF" }}
              display="flex"
              alignItems="center"
              gap="4px"
            >
              <Text size="small" weight="regular" color="#6941C6" sx={{ flex: 1, wordBreak: "break-word" }}>
                {row.value}
              </Text>
              <CopyButton
                text={row.value}
                iconProps={{ color: "#6941C6", width: 20, height: 20 }}
                iconStyle={{ flexShrink: 0 }}
              />
            </Box>
          );
        } else {
          // Custom value type
          value = <Box p="16px 24px">{row.value}</Box>;
        }

        // If valueType is text or link, add a copy button
        if (!!row.value && (valueType === "text" || valueType === "link")) {
          value = (
            <Box p="16px 24px" display="flex" gap="8px" justifyContent="flex-end" alignItems="center">
              <Tooltip title={row.value}>
                {/* Div is Necessary for the Tooltip */}
                <div>{value}</div>
              </Tooltip>
              <CopyButton
                text={row.value}
                iconProps={{ color: "#6941C6", width: 20, height: 20 }}
                iconStyle={{ flexShrink: 0 }}
              />
            </Box>
          );
        }

        return (
          <Fragment key={index}>
            <Box
              borderBottom="1px solid #EAECF0"
              p="16px 24px"
              display="flex"
              flexDirection="column"
              justifyContent="center"
            >
              <Text size="small" weight="medium" color="#101828">
                {row.label}
              </Text>
              <Text size="small" weight="regular" color="#475467">
                {row.description}
              </Text>
            </Box>
            <Box borderBottom="1px solid #EAECF0" display="flex" flexDirection="column" justifyContent="center">
              {value}
            </Box>
          </Fragment>
        );
      })}
    </Box>
  );
};

export default PropertyTable;

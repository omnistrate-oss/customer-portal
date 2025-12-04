import { FC, Fragment } from "react";
import Link from "next/link";
import { Box, BoxProps } from "@mui/material";

import CopyButton from "src/components/Button/CopyButton";
import Tooltip from "src/components/Tooltip/Tooltip";
import { Text } from "src/components/Typography/Typography";

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
} & BoxProps;

const PropertyTable: FC<PropertyTableProps> = ({ rows }) => {
  return (
    <Box sx={{ margin: 0 }}>
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
              paddingTop="12px"
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
          value = <Box paddingTop="20px">{row.value}</Box>;
        }

        // If valueType is text or link, add a copy button
        if (!!row.value && (valueType === "text" || valueType === "link")) {
          value = (
            <Box paddingTop="12px" display="flex" gap="8px" justifyContent="flex-end" alignItems="center">
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
            <Box display="flex" flexDirection="column" justifyContent="center">
              {value}
            </Box>
          </Fragment>
        );
      })}
    </Box>
  );
};

export default PropertyTable;

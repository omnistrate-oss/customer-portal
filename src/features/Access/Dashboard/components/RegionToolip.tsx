import { Stack, styled } from "@mui/material";
import { FC, ReactElement } from "react";
import AWSIcon from "src/components/Icons/CloudProviders/AWSLogo";
import { Text } from "src/components/Typography/Typography";
import MuiTooltip, { tooltipClasses } from "@mui/material/Tooltip";
import { CloudProvider } from "src/types/common/enums";
import GcpLogo from "src/components/Logos/GcpLogo/GcpLogo";

type TooltipContentProps = {
  cloudProvider: CloudProvider;
  region: string;
  children: ReactElement<any, any>;
};
/*@ts-ignore */
export const StyledTooltip = styled(({ className, ...props }) => (
  /*@ts-ignore */
  <MuiTooltip
    placement="bottom"
    {...props}
    arrow
    classes={{ popper: className }}
    slotProps={{
      popper: {
        modifiers: [
          {
            name: "offset",
            options: {
              offset: [-8, 0],
            },
          },
        ],
      },
    }}
  />
))(() => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#FFF",
    color: "#000000",
    fontSize: "14px",
    fontWeight: "400",
    borderRadius: "8px",
    boxShadow: `0px 4px 6px -2px #10182808,
    0px 12px 16px -4px #10182814`,
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: "#fff",
    marginLeft: -8,
  },
}));

const RegionTootlip: FC<TooltipContentProps> = (props) => {
  const { cloudProvider, region, children } = props;
  let CloudProviderIcon = AWSIcon;
  if (cloudProvider === "gcp") {
    CloudProviderIcon = GcpLogo;
  }

  return (
    /*@ts-ignore */
    <StyledTooltip
      arrow
      placement="top"
      title={
        <Stack
          borderRadius="8px"
          padding="12px 16px"
          bgcolor="white"
          alignItems="center"
          gap="8px"
        >
          <CloudProviderIcon />
          <Text size="xsmall" color="#344054">
            {region}
          </Text>
        </Stack>
      }
    >
      {children}
    </StyledTooltip>
  );
};

export default RegionTootlip;

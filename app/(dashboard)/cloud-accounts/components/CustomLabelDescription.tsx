import { FC } from "react";
import Link from "next/link";
import { Box, Stack } from "@mui/material";

import { colors } from "src/themeConfig";
import ChevronRightIcon from "components/Icons/ChevronRight/ChevronRightIcon";
import { Text } from "components/Typography/Typography";

type StyledListItemProps = {
  text: string;
  link: string;
  linkText?: string;
};

export const StyledListItem: FC<StyledListItemProps> = (props) => {
  const { text, link, linkText = "Click here" } = props;

  return (
    <Stack direction="row" alignItems="center" gap="4px">
      <ChevronRightIcon />

      <Text size="small" weight="regular" color="#6f7174">
        {text}{" "}
        <Link
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            textDecoration: "underline",
            color: colors.purple700,
            fontWeight: 500,
          }}
          tabIndex={-1}
        >
          {linkText}
        </Link>
      </Text>
    </Stack>
  );
};

const CustomLabelDescription: FC<{
  hideLinks?: boolean;
  variant: "aws" | "gcpProjectNumber" | "gcpProjectId" | "azureSubscriptionId" | "azureTenantId" | "ociTenancyId" | "ociDomainId";
}> = ({ hideLinks, variant }) => {
  return (
    <Box mt="8px">
      {!hideLinks &&
        (variant === "aws" ? (
          <>
            <StyledListItem
              text="Don't have AWS Account?"
              link="https://signin.aws.amazon.com/signup?request_type=register"
            />

            <StyledListItem
              text="Can't find AWS Account ID?"
              link="https://docs.aws.amazon.com/IAM/latest/UserGuide/console-account-id.html"
            />
          </>
        ) : variant === "gcpProjectId" ? (
          <>
            <StyledListItem text="Don't have GCP Account?" link="https://cloud.google.com/" />
            <StyledListItem
              text="Can't find GCP Project ID?"
              link="https://cloud.google.com/resource-manager/docs/creating-managing-projects#identifying_projects"
            />
          </>
        ) : variant === "gcpProjectNumber" ? (
          <StyledListItem
            text="Can't find GCP Project Number?"
            link="https://cloud.google.com/resource-manager/docs/creating-managing-projects#identifying_projects"
          />
        ) : variant === "azureSubscriptionId" ? (
          <>
            <StyledListItem
              text="Can't find Subscription ID?"
              link={
                "https://learn.microsoft.com/en-us/azure/azure-portal/get-subscription-tenant-id#find-your-azure-active-directory-tenant-id"
              }
            />

            <StyledListItem text="Don't have Azure Account?" link={"https://signup.azure.com/"} />
          </>
        ) : variant === "ociTenancyId" ? (
          <>
            <StyledListItem
              text="Can't find Tenancy OCID?"
              link="https://docs.oracle.com/en-us/iaas/Content/General/Concepts/identifiers.htm#tenancy_ocid"
            />
            <StyledListItem text="Don't have OCI account?" link="https://www.oracle.com/cloud/free/" />
          </>
        ) : variant === "ociDomainId" ? (
          <StyledListItem
            text="Can't find Domain OCID?"
            link="https://docs.oracle.com/en-us/iaas/Content/General/Concepts/identifiers.htm"
          />
        ) : (
          <StyledListItem
            text="Can't find Azure Tenant ID?"
            link={
              "https://learn.microsoft.com/en-us/azure/azure-portal/get-subscription-tenant-id#find-your-azure-active-directory-tenant-id"
            }
          />
        ))}
    </Box>
  );
};

export default CustomLabelDescription;

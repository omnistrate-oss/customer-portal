import { FC, useMemo } from "react";
import { Box } from "@mui/material";
import { getCloudAccountId } from "app/(dashboard)/cloud-accounts/utils";
import CustomTagsCell from "app/(dashboard)/instances/components/CustomTagsCell";

import PropertyDetails, { Row } from "src/components/ResourceInstance/ResourceInstanceDetails/PropertyDetails";
import { ResourceInstance } from "src/types/resourceInstance";
import formatDateUTC from "src/utils/formatDateUTC";
import { getResultParams, isPrivateLinkEnabled } from "src/utils/instance";

type AccountDetailsTabProps = {
  instance: ResourceInstance;
};

const AccountDetailsTab: FC<AccountDetailsTabProps> = ({ instance }) => {
  const rows: Row[] = useMemo(() => {
    const resultParams = getResultParams(instance);

    return [
      {
        dataTestId: "account-id",
        label: "Account ID / Project ID",
        value: getCloudAccountId(resultParams),
        valueType: "text",
      },
      {
        dataTestId: "instance-id",
        label: "Instance ID",
        value: instance?.id,
        valueType: "text",
      },
      {
        dataTestId: "created-on",
        label: "Created on",
        value: instance?.created_at ? formatDateUTC(instance.created_at) : "",
        valueType: "text",
      },
      {
        dataTestId: "private-link-status",
        label: "PrivateLink status",
        // PrivateLink is an AWS-only concept — other providers have nothing to report.
        value: resultParams?.aws_account_id ? (isPrivateLinkEnabled(resultParams) ? "Enabled" : "Disabled") : "",
        valueType: "boolean",
      },
      {
        dataTestId: "custom-tags",
        label: "Tags",
        value: <CustomTagsCell customTags={instance?.customTags} displayNumber={2} sx={{ flexWrap: "wrap" }} />,
        valueType: "custom",
      },
    ];
  }, [instance]);

  return (
    <Box sx={{ marginTop: "24px" }}>
      <PropertyDetails
        rows={{
          title: "Account information",
          desc: "View the configuration details for this cloud account.",
          rows,
          flexWrap: true,
        }}
      />
    </Box>
  );
};

export default AccountDetailsTab;

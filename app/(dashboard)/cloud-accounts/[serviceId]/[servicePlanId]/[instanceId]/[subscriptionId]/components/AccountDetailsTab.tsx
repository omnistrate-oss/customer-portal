import { FC, useMemo } from "react";
import { Stack } from "@mui/material";
import { getCloudAccountProvider } from "app/(dashboard)/cloud-accounts/utils";

import PropertyDetails, {
  ContainerCard,
} from "src/components/ResourceInstance/ResourceInstanceDetails/PropertyDetails";
import { ResourceInstance } from "src/types/resourceInstance";
import { getResultParams } from "src/utils/instance";

import { getAccountDetailRows, getSetupCommands } from "./accountDetails";
import CommandList from "./CommandList";
import NebiusBindingsTable from "./NebiusBindingsTable";

type AccountDetailsTabProps = {
  instance: ResourceInstance;
};

const AccountDetailsTab: FC<AccountDetailsTabProps> = ({ instance }) => {
  const resultParams = getResultParams(instance);
  const cloudProvider = getCloudAccountProvider(resultParams);

  const rows = useMemo(() => getAccountDetailRows(instance, cloudProvider), [instance, cloudProvider]);
  const commands = useMemo(() => getSetupCommands(instance, cloudProvider), [instance, cloudProvider]);

  return (
    <Stack gap="24px" mt="24px">
      <PropertyDetails
        rows={{
          title: "Account information",
          desc: "The identifiers and configuration for this cloud account.",
          rows,
          flexWrap: true,
        }}
      />

      {commands.length > 0 && (
        <ContainerCard
          data-testid="account-setup-commands-card"
          title="Setup commands"
          description="The commands used to connect and disconnect this account."
        >
          <CommandList commands={commands} titleTestId="account-command-title" />
        </ContainerCard>
      )}

      {cloudProvider === "nebius" && (
        <NebiusBindingsTable accountConfigId={resultParams?.cloud_provider_account_config_id} />
      )}
    </Stack>
  );
};

export default AccountDetailsTab;

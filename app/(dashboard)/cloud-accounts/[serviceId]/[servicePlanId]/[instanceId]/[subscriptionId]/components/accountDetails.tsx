import CustomTagsCell from "app/(dashboard)/instances/components/CustomTagsCell";

import { Row } from "src/components/ResourceInstance/ResourceInstanceDetails/PropertyDetails";
import { CloudProvider } from "src/types/common/enums";
import { ResourceInstance } from "src/types/resourceInstance";
import { addQuotesToShellCommand } from "src/utils/accountConfig/accountConfig";
import formatDateUTC from "src/utils/formatDateUTC";
import { getResultParams, isPrivateLinkEnabled } from "src/utils/instance";

import { CommandListItem } from "./CommandList";

type ResultParams = Record<string, any>;

type FieldDefinition = {
  /** Key on the instance's result params. */
  key: string;
  label: string;
};

/**
 * The identifiers worth reading off the page, per provider. A cloud account carries a long
 * tail of result params; these are the ones an operator actually needs, named the way the
 * provider names them rather than as a generic "Account ID".
 */
const IDENTITY_FIELDS: Record<CloudProvider, FieldDefinition[]> = {
  aws: [
    { key: "aws_account_id", label: "AWS Account ID" },
    { key: "aws_bootstrap_role_arn", label: "Bootstrap Role ARN" },
  ],
  gcp: [
    { key: "gcp_project_id", label: "Project ID" },
    { key: "gcp_project_number", label: "Project Number" },
    { key: "gcp_service_account_email", label: "Service Account Email" },
  ],
  azure: [
    { key: "azure_subscription_id", label: "Subscription ID" },
    { key: "azure_tenant_id", label: "Tenant ID" },
  ],
  oci: [
    { key: "oci_tenancy_id", label: "Tenancy ID" },
    { key: "oci_domain_id", label: "Domain ID" },
  ],
  nebius: [{ key: "nebius_tenant_id", label: "Tenant ID" }],
  "byoc-onprem": [
    { key: "cluster_name", label: "Cluster Name" },
    { key: "cluster_description", label: "Cluster Description" },
  ],
};

type CommandDefinition = FieldDefinition & {
  description: string;
  /** URLs get an open-in-new-tab button; shell commands get quoted before they're copied. */
  kind: "shell" | "url";
};

const SETUP_COMMANDS: Record<CloudProvider, CommandDefinition[]> = {
  aws: [
    {
      key: "cloudformation_url",
      label: "Account setup stack",
      description: "Creates the IAM roles and policies that let the service provider operate this account.",
      kind: "url",
    },
  ],
  gcp: [
    {
      key: "gcp_bootstrap_shell_script",
      label: "Set up account",
      description: "Run in Cloud Shell to grant the service provider access to this project.",
      kind: "shell",
    },
    {
      key: "gcp_disconnect_shell_script",
      label: "Disconnect account",
      description: "Run in Cloud Shell to revoke the service provider's access to this project.",
      kind: "shell",
    },
  ],
  azure: [
    {
      key: "azure_bootstrap_shell_script",
      label: "Set up account",
      description: "Run in Azure Cloud Shell to grant the service provider access to this subscription.",
      kind: "shell",
    },
    {
      key: "azure_disconnect_shell_script",
      label: "Disconnect account",
      description: "Run in Azure Cloud Shell to revoke the service provider's access to this subscription.",
      kind: "shell",
    },
  ],
  oci: [
    {
      key: "oci_bootstrap_shell_script",
      label: "Set up account",
      description: "Run in Cloud Shell to grant the service provider access to this tenancy.",
      kind: "shell",
    },
    {
      key: "oci_disconnect_shell_script",
      label: "Disconnect account",
      description: "Run in Cloud Shell to revoke the service provider's access to this tenancy.",
      kind: "shell",
    },
  ],
  nebius: [],
  "byoc-onprem": [
    {
      key: "byoc_onprem_install_command",
      label: "Install agent",
      description: "Run against the cluster to install the Dataplane Agent.",
      kind: "shell",
    },
    {
      key: "byoc_onprem_uninstall_command",
      label: "Uninstall agent",
      description: "Run against the cluster to remove the Dataplane Agent.",
      kind: "shell",
    },
  ],
};

const toDataTestId = (key: string) => key.replace(/_/g, "-");

export const getAccountDetailRows = (instance: ResourceInstance, cloudProvider?: CloudProvider): Row[] => {
  const resultParams: ResultParams = getResultParams(instance);
  const identityFields = cloudProvider ? IDENTITY_FIELDS[cloudProvider] : [];

  const identityRows: Row[] = identityFields
    .filter(({ key }) => resultParams?.[key])
    .map(({ key, label }) => ({
      dataTestId: toDataTestId(key),
      label,
      value: resultParams[key],
      valueType: "text",
    }));

  const rows: Row[] = [...identityRows];

  // PrivateLink is an AWS-only concept, and absent means disabled rather than unknown.
  if (cloudProvider === "aws") {
    rows.push({
      dataTestId: "private-link-status",
      label: "PrivateLink status",
      value: isPrivateLinkEnabled(resultParams) ? "Enabled" : "Disabled",
      valueType: "boolean",
    });
  }

  if (resultParams?.account_configuration_method) {
    rows.push({
      dataTestId: "configuration-method",
      label: "Configuration method",
      value: resultParams.account_configuration_method,
      valueType: "text",
    });
  }

  rows.push(
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
    }
  );

  if (resultParams?.cloud_provider_account_config_id) {
    rows.push({
      dataTestId: "account-config-id",
      label: "Account Config ID",
      value: resultParams.cloud_provider_account_config_id,
      valueType: "text",
    });
  }

  rows.push({
    dataTestId: "custom-tags",
    label: "Tags",
    value: <CustomTagsCell customTags={instance?.customTags} displayNumber={2} sx={{ flexWrap: "wrap" }} />,
    valueType: "custom",
  });

  return rows;
};

export const getSetupCommands = (instance: ResourceInstance, cloudProvider?: CloudProvider): CommandListItem[] => {
  const resultParams: ResultParams = getResultParams(instance);
  const definitions = cloudProvider ? SETUP_COMMANDS[cloudProvider] : [];

  return definitions.flatMap(({ key, label, description, kind }) => {
    const value = resultParams?.[key];
    if (!value) return [];

    return [
      {
        title: label,
        description,
        command: value,
        ...(kind === "url" ? { href: value } : { copyValue: addQuotesToShellCommand(value) }),
      },
    ];
  });
};

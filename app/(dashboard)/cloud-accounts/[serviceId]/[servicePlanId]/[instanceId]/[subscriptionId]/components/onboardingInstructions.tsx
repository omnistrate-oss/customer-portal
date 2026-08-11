import { ReactNode } from "react";
import Link from "next/link";
import { styled } from "@mui/material";

import { CloudProvider } from "src/types/common/enums";
import { ResourceInstance } from "src/types/resourceInstance";
import {
  addQuotesToShellCommand,
  getAzureBootstrapShellCommand,
  getGcpBootstrapShellCommand,
} from "src/utils/accountConfig/accountConfig";
import { getAccountConfigStatusBasedHeader } from "src/utils/constants/accountConfig";
import { getResultParams } from "src/utils/instance";

import { CommandListItem } from "./CommandList";

type ResultParams = Record<string, any>;

const GCP_CLOUD_SHELL_URL = "https://shell.cloud.google.com/?cloudshell_ephemeral=true&show=terminal";
const AZURE_CLOUD_SHELL_URL = "https://portal.azure.com/#cloudshell/";
const OCI_CLOUD_SHELL_URL = "https://cloud.oracle.com/?cloudshell=true";

const CLOUDFORMATION_GUIDE_URL = "https://youtu.be/c3HNnM8UJBE";
const GCP_GUIDE_URL = "https://youtu.be/isTGi8tQA2w?si=a12mJXnlA-y2ipVC";
const AZURE_GUIDE_URL = "https://youtu.be/7A9WbZjuXgQ?si=y-AvMmtdFIycqzOS";

const PENDING_NOTICE =
  "Your account details are being configured. Please check back shortly for detailed setup instructions.";

const StyledLink = styled(Link)({
  textDecoration: "underline",
  color: "#7F56D9",
  fontWeight: 600,
});

const ExternalLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <StyledLink href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </StyledLink>
);

type ProviderInstructions = {
  title: string;
  description: ReactNode;
  /** Reads the setup command, or the stack template URL, off the instance's result params. */
  getCommand: (resultParams: ResultParams) => string | undefined;
  /** URLs get an open-in-new-tab button; shell commands are quoted before they're copied. */
  isUrl?: boolean;
  /** Shown in place of the command once verification has failed. */
  failedNotice: string;
};

/**
 * Per-provider onboarding steps, mirroring the instructions modal. Nebius and byoc-onprem are
 * onboarded through flows that surface their own instructions, so they show no card here.
 */
const PROVIDER_INSTRUCTIONS: Record<CloudProvider, ProviderInstructions | null> = {
  aws: {
    title: "Create CloudFormation stack",
    description: (
      <>
        Create your CloudFormation stack using the provided template. If an existing AWSLoadBalancerControllerIAMPolicy
        policy causes an error while creating the stack, set the parameter CreateLoadBalancerPolicy to
        &quot;false&quot;. For guidance, our instructional video is available{" "}
        <ExternalLink href={CLOUDFORMATION_GUIDE_URL}>here</ExternalLink>.
      </>
    ),
    getCommand: (resultParams) => resultParams?.cloudformation_url || resultParams?.cloudformation_url_no_lb,
    isUrl: true,
    failedNotice:
      "You may delete this failed configuration and retry adding it after carefully verifying the AWS Account ID. If the issue persists, please contact Support for assistance.",
  },
  gcp: {
    title: "Set up account",
    description: (
      <>
        Open the Google Cloud Shell environment using the following link{" "}
        <ExternalLink href={GCP_CLOUD_SHELL_URL}>Google Cloud Shell</ExternalLink> and execute the command below. For
        guidance our instructional video is <ExternalLink href={GCP_GUIDE_URL}>here</ExternalLink>.
      </>
    ),
    getCommand: (resultParams) =>
      resultParams?.gcp_bootstrap_shell_script ||
      (resultParams?.cloud_provider_account_config_id
        ? getGcpBootstrapShellCommand(resultParams.cloud_provider_account_config_id)
        : undefined),
    failedNotice:
      "You may delete this failed configuration and retry adding it after carefully verifying the GCP Project ID and Project Number. If the issue persists, please contact Support for assistance.",
  },
  azure: {
    title: "Set up account",
    description: (
      <>
        Open the Azure Cloud Shell environment using the following link{" "}
        <ExternalLink href={AZURE_CLOUD_SHELL_URL}>Azure Cloud Shell</ExternalLink> and execute the command below. For
        guidance our instructional video is <ExternalLink href={AZURE_GUIDE_URL}>here</ExternalLink>.
      </>
    ),
    getCommand: (resultParams) =>
      resultParams?.azure_bootstrap_shell_script ||
      (resultParams?.cloud_provider_account_config_id
        ? getAzureBootstrapShellCommand(resultParams.cloud_provider_account_config_id)
        : undefined),
    failedNotice:
      "You may delete this failed configuration and retry adding it after carefully verifying the Azure Subscription ID and Tenant ID. If the issue persists, please contact Support for assistance.",
  },
  oci: {
    title: "Set up account",
    description: (
      <>
        Open the OCI Cloud Shell environment using the following link{" "}
        <ExternalLink href={OCI_CLOUD_SHELL_URL}>OCI Cloud Shell</ExternalLink> and execute the command below.
      </>
    ),
    getCommand: (resultParams) => resultParams?.oci_bootstrap_shell_script,
    failedNotice:
      "You may delete this failed configuration and retry adding it after carefully verifying the OCI Tenancy OCID and Domain OCID. If the issue persists, please contact Support for assistance.",
  },
  nebius: null,
  "byoc-onprem": null,
};

export type OnboardingInstructions = {
  /** Status-derived sentence explaining why the instructions are being shown. */
  header: string;
  /** The onboarding step, once its command is available. */
  steps: CommandListItem[];
  /** Shown in place of the step while the command is unavailable. */
  notice?: string;
  /** Set for AWS only, so the card can offer the CLI equivalent of the quick-create link. */
  awsCloudFormationUrl?: string;
};

export const getOnboardingInstructions = (
  instance: ResourceInstance,
  cloudProvider?: CloudProvider
): OnboardingInstructions | null => {
  const instructions = cloudProvider ? PROVIDER_INSTRUCTIONS[cloudProvider] : null;
  if (!instructions) return null;

  const resultParams: ResultParams = getResultParams(instance);
  const header = getAccountConfigStatusBasedHeader(
    instance?.status,
    resultParams?.cloud_provider_account_config_id
  ) as string;

  const command = instructions.getCommand(resultParams);
  if (!command) {
    return {
      header,
      steps: [],
      notice: instance?.status === "FAILED" ? instructions.failedNotice : PENDING_NOTICE,
    };
  }

  return {
    header,
    steps: [
      {
        title: instructions.title,
        description: instructions.description,
        command,
        ...(instructions.isUrl ? { href: command } : { copyValue: addQuotesToShellCommand(command) }),
      },
    ],
    ...(cloudProvider === "aws" ? { awsCloudFormationUrl: command } : {}),
  };
};

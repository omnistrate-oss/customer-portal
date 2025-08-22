import { useMemo } from "react";
import { Box } from "@mui/material";
import { Base64 } from "js-base64";

import InstanceLicenseStatusChip from "src/components/InstanceLicenseStatusChip/InstanceLicenseStatusChip";
import { INTEGRATION_TYPE_LABEL_MAP } from "src/constants/productTierFeatures";
import formatDateUTC from "src/utils/formatDateUTC";
import LoadingSpinner from "components/LoadingSpinner/LoadingSpinner";

import NonOmnistrateIntegrationRow from "./NonOmnistrateIntegrationRow";
import PropertyDetails from "./PropertyDetails";
import TerraformDownloadURL from "./TerraformDownloadURL";
import UpgradeScheduledNotificationBar from "./UpgradeScheduledNotificationBar";

function ResourceInstanceDetails(props) {
  const {
    resourceInstanceId,
    resultParameters = {},
    isLoading,
    resultParametersSchema = [],
    createdAt,
    modifiedAt,
    subscriptionId,
    serviceOffering,
    nonOmnistrateInternalLogs,
    nonOmnistrateInternalMetrics,
    customNetworkDetails,
    cloudProviderAccountInstanceURL,
    autoscalingEnabled,
    highAvailability,
    backupStatus,
    autoscaling,
    autostopEnabled,
    isCliManagedResource,
    maintenanceTasks,
    licenseDetails,
  } = props;

  const isResourceBYOA = resultParameters.gcp_project_id || resultParameters.aws_account_id;

  const resultParametersWithDescription = useMemo(() => {
    const result = Object.keys(resultParameters)
      .map((key) => {
        const match = resultParametersSchema.find((param) => param.key === key);
        return {
          ...match,
          value: resultParameters[key],
          key,
        };
      })
      .filter((param) => {
        const filterArr = [
          "availability_zones",
          "cluster_endpoint",
          "node_endpoints",
          "private_network_cidr",
          "private_network_id",
        ];

        if (isResourceBYOA) {
          if (resultParameters.cloud_provider === "aws") {
            filterArr.push(...["gcp_project_id", "gcp_project_number", "gcp_service_account_email"]);
          } else if (resultParameters.cloud_provider === "gcp") {
            filterArr.push(...["aws_account_id", "aws_bootstrap_role_arn"]);
          }

          if (resultParameters.account_configuration_method === "Terraform") {
            filterArr.push("cloudformation_url");
          }
        }

        return !filterArr.includes(param.key);
      })
      .sort((a, b) => {
        const aTabIndex = a.tabIndex;
        const bTabIndex = b.tabIndex;
        if (aTabIndex !== undefined && bTabIndex !== undefined) {
          return aTabIndex - bTabIndex; // Sort by tabIndex if available
        }
        return 0; // If tabIndex is not available, maintain original order
      });
    return result;
  }, [isResourceBYOA, resultParameters, resultParametersSchema]);

  const instanceInfoData = useMemo(() => {
    const res = [
      {
        dataTestId: "deployment-id",
        label: "Instance ID",
        value: resourceInstanceId,
      },
      {
        dataTestId: "created-at",
        label: "Created at",
        value: formatDateUTC(createdAt),
      },
      {
        dataTestId: "modified-at",
        label: "Modified at",
        value: formatDateUTC(modifiedAt),
      },
      {
        dataTestId: "high-availability-status",
        label: "HA",
        value: highAvailability ? "Enabled" : "Disabled",
        valueType: "boolean",
      },
    ];
    if (!isCliManagedResource) {
      res.push(
        {
          dataTestId: "backups-status",
          label: "Backups",
          value: backupStatus?.backupPeriodInHours ? "Enabled" : "Disabled",
          valueType: "boolean",
        },
        {
          dataTestId: "autoscaling-status",
          label: "Autoscaling",
          value: autoscalingEnabled ? "Enabled" : "Disabled",
          valueType: "boolean",
        }
      );
    }
    return res;
  }, [
    resourceInstanceId,
    createdAt,
    modifiedAt,
    autoscalingEnabled,
    subscriptionId,
    resultParameters,
    highAvailability,
    backupStatus,
    isCliManagedResource,
  ]);

  const licenseData = useMemo(() => {
    const res = [
      {
        label: "License Status",
        valueType: "custom",
        value: <InstanceLicenseStatusChip expirationDate={licenseDetails?.expirationDate} />,
      },
      {
        label: "License Expiry Date",
        value: formatDateUTC(licenseDetails?.expirationDate),
      },
      {
        label: "Download License",
        value: licenseDetails?.licenseBase64 ? Base64.decode(licenseDetails?.licenseBase64) : "",
        valueType: "download",
      },
    ];
    return res;
  }, [licenseDetails]);

  const backupData = useMemo(() => {
    const res = [
      {
        label: "Recovery Point Objective",
        value: `${backupStatus?.backupPeriodInHours} ${backupStatus?.backupPeriodInHours > 1 ? " hrs" : " hr"}`,
      },
      {
        label: "Retention duration",
        value: `${backupStatus?.backupRetentionInDays} ${backupStatus?.backupRetentionInDays > 1 ? " days" : " day"}`,
      },
      {
        label: "Earliest Restore Time",
        value: backupStatus?.earliestRestoreTime ? formatDateUTC(backupStatus?.earliestRestoreTime) : "-",
        valueType: backupStatus?.earliestRestoreTime ? "text" : "custom",
      },
      {
        label: "Last Backup Time",
        value: backupStatus?.lastBackupTime ? formatDateUTC(backupStatus?.lastBackupTime) : "-",
        valueType: backupStatus?.lastBackupTime ? "text" : "custom",
      },
      {
        label: "RTO",
        value: "Few minutes, typically <5 minutes",
      },
    ];

    return res;
  }, [backupStatus]);

  const autoscalingData = useMemo(() => {
    const res = [
      {
        label: "Min replicas",
        value: autoscaling?.minReplicas,
      },

      {
        label: "Max Replicas",
        value: autoscaling?.maxReplicas,
      },
      {
        label: "Current number of replicas",
        value: autoscaling?.currentReplicas,
      },
      {
        label: "Auto stop",
        value: autostopEnabled ? "Enabled" : "Disabled",
        valueType: "boolean",
      },
    ];

    return res;
  }, [autoscaling, autostopEnabled]);

  const customNetworkData = useMemo(() => {
    const res = [
      {
        label: "Customer Network ID",
        value: customNetworkDetails?.id,
      },
      {
        label: "Customer Network Name",
        value: customNetworkDetails?.name,
      },
      {
        label: "Customer Network CIDR",
        value: customNetworkDetails?.cidr,
      },
    ];
    return res;
  }, [customNetworkDetails]);

  const outputParameterData = useMemo(() => {
    const res = [];
    if (serviceOffering && subscriptionId && resultParameters.account_configuration_method === "Terraform") {
      res.push({
        label: "Terraform Download URL",
        description: "Terraform Kit URL to configure access to an AWS/GCP account",
        value: (
          <TerraformDownloadURL
            serviceOffering={serviceOffering}
            subscriptionId={subscriptionId}
            cloud_provider={resultParameters.aws_account_id ? "aws" : "gcp"}
          />
        ),
        valueType: "custom",
      });
    }
    if (nonOmnistrateInternalMetrics?.Url) {
      res.push({
        label: INTEGRATION_TYPE_LABEL_MAP[nonOmnistrateInternalMetrics.featureName],
        value: <NonOmnistrateIntegrationRow integration={nonOmnistrateInternalMetrics} />,
        valueType: "custom",
      });
    }

    if (nonOmnistrateInternalLogs?.Url) {
      res.push({
        label: INTEGRATION_TYPE_LABEL_MAP[nonOmnistrateInternalLogs.featureName],
        value: <NonOmnistrateIntegrationRow integration={nonOmnistrateInternalLogs} />,
        valueType: "custom",
      });
    }

    resultParametersWithDescription.forEach((param) => {
      if (
        param.key === "cloud_provider_account_config_id" &&
        param.value?.startsWith("instance") &&
        cloudProviderAccountInstanceURL
      ) {
        return res.push({
          label: param.displayName || param.key,
          description: param.description,
          value: param.value,
          valueType: "link",
          linkProps: {
            href: cloudProviderAccountInstanceURL,
            target: "_blank",
          },
        });
      }
      if (param.key === "cloudformation_url_no_lb" || param.key === "cloudformation_url") {
        return res.push({
          label: param.displayName || param.key,
          description: param.description,
          value: param.value,
          valueType: "link",
          linkProps: {
            href: param.value,
            target: "_blank",
          },
        });
      } else {
        res.push({
          label: param.displayName || param.key,
          description: param.description,
          value: param.value,
          valueType: param.key === "cloud_provider" ? "cloudProvider" : param.type,
        });
      }
    });

    return res;
  }, [
    resultParametersWithDescription,
    serviceOffering,
    subscriptionId,
    nonOmnistrateInternalLogs,
    nonOmnistrateInternalMetrics,
    cloudProviderAccountInstanceURL,
    resultParameters?.account_configuration_method,
    resultParameters.aws_account_id,
  ]);

  const CloudPRoviderInstance = useMemo(() => {
    const res = {
      isCloudPRoviderInstance: false,
      cloudProviderName: "",
    };

    resultParametersWithDescription.forEach((param) => {
      if (param.key === "cloud_provider") {
        res["cloudProviderName"] = param.value;
        res["isCloudPRoviderInstance"] = true;
      }
    });
    return res;
  }, [resultParametersWithDescription]);

  if (isLoading) {
    return (
      <Box
        sx={{
          width: "100%",
          mt: "54px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <LoadingSpinner />
      </Box>
    );
  }

  const hasPendingUpgrades = maintenanceTasks?.upgrade_paths?.length > 0;

  return (
    <Box marginTop={"20px"}>
      {hasPendingUpgrades && (
        <UpgradeScheduledNotificationBar
          upgradeStatus={maintenanceTasks.upgrade_paths[0].upgrade_status}
          upgradeDate={maintenanceTasks.upgrade_paths?.[0]?.upgrade_path_scheduled_at}
        />
      )}
      <PropertyDetails
        data-testid="resource-instance-details-table"
        rows={{
          title: "Instance Info",
          desc: "Basic information about this deployment instance",
          rows: instanceInfoData,
          flexWrap: true,
        }}
      />
      {licenseDetails?.expirationDate && (
        <PropertyDetails
          data-testid="license-status-table"
          rows={{
            title: "License Status",
            desc: "Shows the current license status, expiry date, and option to download the license file.",
            rows: licenseData,
            flexWrap: true,
          }}
          mt="20px"
        />
      )}
      {outputParameterData.length > 0 && (
        <PropertyDetails
          data-testid="output-parameters-table"
          rows={{
            title: CloudPRoviderInstance?.isCloudPRoviderInstance
              ? `${CloudPRoviderInstance?.cloudProviderName === "aws" ? "AWS" : "GCP"} Cloud account config`
              : "Parameter",
            desc: CloudPRoviderInstance?.isCloudPRoviderInstance
              ? `${CloudPRoviderInstance?.cloudProviderName === "aws" ? "AWS" : "GCP"} account configuration details`
              : "Parameters for this instance",
            rows: outputParameterData,
            flexWrap: true,
          }}
          mt="20px"
        />
      )}
      {customNetworkDetails && (
        <PropertyDetails
          data-testid="resource-instance-details-table"
          rows={{
            title: "Customer Network",
            desc: "Customer network details",
            rows: customNetworkData,
            flexWrap: true,
          }}
          mt="12px"
        />
      )}

      {backupStatus?.backupPeriodInHours && (
        <PropertyDetails
          data-testid="resource-instance-details-table"
          rows={{
            title: "Backup",
            desc: "Backup configurations (RTO, RPO etc)",
            rows: backupData,
            flexWrap: true,
          }}
          mt="20px"
        />
      )}
      {autoscalingEnabled && (
        <PropertyDetails
          data-testid="resource-instance-details-table"
          rows={{
            title: "Autoscaling",
            desc: "Autoscaling settings of this instance",
            rows: autoscalingData,
            flexWrap: true,
          }}
          mt="20px"
        />
      )}
    </Box>
  );
}

export default ResourceInstanceDetails;

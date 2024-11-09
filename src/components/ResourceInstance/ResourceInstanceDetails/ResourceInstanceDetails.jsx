import { useMemo } from "react";
import { Box } from "@mui/material";
import formatDateUTC from "src/utils/formatDateUTC";

import LoadingSpinner from "components/LoadingSpinner/LoadingSpinner";

import TerraformDownloadURL from "./TerraformDownloadURL";
import NonOmnistrateIntegrationRow from "./NonOmnistrateIntegrationRow";
import { INTEGRATION_TYPE_LABEL_MAP } from "src/constants/productTierFeatures";
import PropertyDetails from "./PropertyDetails";

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
    serverlessEnabled,
  } = props;

  const isResourceBYOA =
    resultParameters.gcp_project_id || resultParameters.aws_account_id;

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
            filterArr.push(
              ...[
                "gcp_project_id",
                "gcp_project_number",
                "gcp_service_account_email",
              ]
            );
          } else if (resultParameters.cloud_provider === "gcp") {
            filterArr.push(...["aws_account_id", "aws_bootstrap_role_arn"]);
          }

          if (resultParameters.account_configuration_method === "Terraform") {
            filterArr.push("cloudformation_url");
          }
        }

        return !filterArr.includes(param.key);
      });
    return result;
  }, [isResourceBYOA, resultParameters, resultParametersSchema]);

  const instanceInfoData = useMemo(() => {
    const res = [
      {
        label: "Instance ID",
        value: resourceInstanceId,
      },
      {
        label: "Created at",
        value: formatDateUTC(createdAt),
      },
      {
        label: "Modified at",
        value: formatDateUTC(modifiedAt),
      },
      {
        label: "HA",
        value: highAvailability ? "Enabled" : "Disabled",
        valueType: "boolean",
      },
      {
        label: "Backups",
        value: backupStatus?.backupPeriodInHours ? "Enabled" : "Disabled",
        valueType: "boolean",
      },
      {
        label: "Autoscaling",
        value: autoscalingEnabled ? "Enabled" : "Disabled",
        valueType: "boolean",
      },
    ];

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
  ]);

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
        value: backupStatus?.earliestRestoreTime
          ? backupStatus?.earliestRestoreTime
          : "-",
        valueType: backupStatus?.earliestRestoreTime ? "text" : "custom",
      },
      {
        label: "Last Backup Time",
        value: backupStatus?.lastBackupTime
          ? backupStatus?.lastBackupTime
          : "-",
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
        value: serverlessEnabled ? "Enabled" : "Disabled",
        valueType: "boolean",
      },
    ];

    return res;
  }, [autoscaling]);

  const customNetworkData = useMemo(() => {
    const res = [
      {
        label: "Custom Network ID",
        value: customNetworkDetails?.id,
      },
      {
        label: "Custom Network Name",
        value: customNetworkDetails?.name,
      },
      {
        label: "Custom Network CIDR",
        value: customNetworkDetails?.cidr,
      },
    ];
    return res;
  }, [customNetworkDetails]);

  const outputParameterData = useMemo(() => {
    const res = [];
    if (
      serviceOffering &&
      subscriptionId &&
      resultParameters.account_configuration_method === "Terraform"
    ) {
      res.push({
        label: "Terraform Download URL",
        description:
          "Terraform Kit URL to configure access to an AWS/GCP account",
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
        label:
          INTEGRATION_TYPE_LABEL_MAP[nonOmnistrateInternalMetrics.featureName],
        value: (
          <NonOmnistrateIntegrationRow
            integration={nonOmnistrateInternalMetrics}
          />
        ),
        valueType: "custom",
      });
    }

    if (nonOmnistrateInternalLogs?.Url) {
      res.push({
        label:
          INTEGRATION_TYPE_LABEL_MAP[nonOmnistrateInternalLogs.featureName],
        value: (
          <NonOmnistrateIntegrationRow
            integration={nonOmnistrateInternalLogs}
          />
        ),
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
      if (
        param.key === "cloudformation_url_no_lb" ||
        param.key === "cloudformation_url"
      ) {
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
          valueType:
            param.key === "cloud_provider" ? "cloudProvider" : param.type,
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

  return (
    <Box
      marginTop={"32px"}
      borderRadius="8px"
      border="1px solid  rgba(228, 231, 236, 1)"
      padding={"12px"}
      gap="12px"
      boxShadow="inset 0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.1)"
    >
      <PropertyDetails
        data-testid="resource-instance-details-table"
        rows={{
          title: "Instance Info",
          desc: "Basic information about this resource instance",
          rows: instanceInfoData,
          flexWrap: false,
        }}
      />
      {outputParameterData.length > 0 && (
        <PropertyDetails
          data-testid="resource-instance-details-table"
          rows={{
            title: CloudPRoviderInstance?.isCloudPRoviderInstance
              ? `${CloudPRoviderInstance?.cloudProviderName === "aws" ? "AWS" : "GCP"} Cloud account config`
              : "Output Parameter",
            desc: CloudPRoviderInstance?.isCloudPRoviderInstance
              ? `${CloudPRoviderInstance?.cloudProviderName === "aws" ? "AWS" : "GCP"} account configuration details`
              : "Output parameters for this instance",
            rows: outputParameterData,
            flexWrap: true,
          }}
          mt="12px"
        />
      )}
      {customNetworkDetails && (
        <PropertyDetails
          data-testid="resource-instance-details-table"
          rows={{
            title: "Custom Network",
            desc: "Custom network details",
            rows: customNetworkData,
            flexWrap: false,
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
            flexWrap: false,
          }}
          mt="12px"
        />
      )}
      {autoscalingEnabled && (
        <PropertyDetails
          data-testid="resource-instance-details-table"
          rows={{
            title: "Autoscaling",
            desc: "Autoscaling settings of this instance",
            rows: autoscalingData,
            flexWrap: false,
          }}
          mt="12px"
        />
      )}
    </Box>
  );
}

export default ResourceInstanceDetails;

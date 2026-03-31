import { Box, styled } from "@mui/material";

import { Text } from "src/components/Typography/Typography";
import { colors } from "src/themeConfig";

import AmazonEKSIcon from "./Kubernetes/AmazonEKSIcon";
import AzureAKSIcon from "./Kubernetes/AzureAKSIcon";
import GenericIcon from "./Kubernetes/GenericIcon";
import GoogleGKEIcon from "./Kubernetes/GoogleGKEIcon";

export const KubernetesDistributionLogoMap = {
  eks: <AmazonEKSIcon />,
  aks: <AzureAKSIcon />,
  gke: <GoogleGKEIcon />,
  generic: <GenericIcon />,
};

export const KubernetesDistributionMap = {
  EKS: "Amazon EKS",
  GKE: "Google GKE",
  AKS: "Azure AKS",
  Generic: "Generic",
};

const KubernetesDistributionCard = styled(Box)<{ selected?: boolean; disabled?: boolean }>(
  ({ selected, disabled }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    borderRadius: "8px",
    border: "2px solid",
    borderColor: selected ? `${colors.success500}` : "#E5E7EB",
    backgroundColor: disabled ? "#F3F4F6" : "#FFFFFF",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    minWidth: "110px",
    transition: "all 0.2s ease-in-out",
    pointerEvents: disabled ? "none" : "auto",
    "&:hover": {
      borderColor: selected ? `${colors.success500}` : "#9CA3AF",
      backgroundColor: disabled ? "#F3F4F6" : "#F9FAFB",
    },
    boxShadow: "0px 1px 2px 0px #0A0D120D",
  })
);

type KubernetesDistribution = "EKS" | "GKE" | "AKS" | "Generic";

type KubernetesDistributionsMultiSelectProps = {
  setFieldValue: (field: string, value: string | string[]) => void;
  onPremPlatforms: string | string[];
  multiple?: boolean;
  onPremPlatformOptions?: KubernetesDistribution[];
  disabled?: boolean;
};

const KubernetesDistributionsMultiSelect = ({
  setFieldValue,
  onPremPlatforms,
  multiple = false,
  onPremPlatformOptions,
  disabled,
}: KubernetesDistributionsMultiSelectProps) => {
  const fieldValue = onPremPlatforms;

  const isSelected = (option: string) => {
    if (multiple) {
      return Array.isArray(fieldValue) && fieldValue.includes(option);
    }
    return fieldValue === option;
  };

  const handleClick = (option: string) => {
    if (multiple) {
      const currentValues = Array.isArray(fieldValue) ? fieldValue : [];
      const newValues = currentValues.includes(option)
        ? currentValues.filter((v) => v !== option)
        : [...currentValues, option];
      setFieldValue("onprem_platform", newValues);
    } else {
      // In single selection mode, allow toggling the same option or selecting a new one
      const newValue = fieldValue === option ? "" : option;
      setFieldValue("onprem_platform", newValue);
    }
  };

  return (
    <>
      <Box display="flex" gap="12px" flexWrap="wrap">
        {onPremPlatformOptions?.map((option) => (
          <KubernetesDistributionCard
            disabled={disabled}
            key={option}
            selected={isSelected(option)}
            onClick={() => !disabled && handleClick(option)}
          >
            <Box marginBottom="1px">{KubernetesDistributionLogoMap[option.toLowerCase()]}</Box>
            <Text size="small" weight="medium">
              {KubernetesDistributionMap[option]}
            </Text>
          </KubernetesDistributionCard>
        ))}
      </Box>
    </>
  );
};

export default KubernetesDistributionsMultiSelect;
export { KubernetesDistributionCard };

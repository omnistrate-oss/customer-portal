"use client";

import { cn } from "lib/utils";

import { cloudProviderLabels } from "src/constants/cloudProviders";
import { colors } from "src/themeConfig";
import { Text } from "components/Typography/Typography";

import AWSIcon from "./AWSIcon";
import AzureIcon from "./AzureIcon";
import GcpIcon from "./GCPIcon";
import OCIIcon from "./OCIIcon";

const cloudIcons = {
  aws: <AWSIcon style={{ height: "32px", width: "auto" }} />,
  gcp: <GcpIcon style={{ height: "32px", width: "auto" }} />,
  azure: <AzureIcon style={{ height: "32px", width: "auto" }} />,
  oci: <OCIIcon style={{ height: "32px", width: "auto" }} />,
};

const CloudProviderCard = ({ cloudProvider, isSelected, onClick, disabled }) => {
  return (
    <div
      data-testid={`${cloudProvider}-card`}
      className={cn(
        "px-4 py-4 rounded-xl text-center flex flex-col justify-between items-center min-h-28",
        disabled ? "cursor-default bg-gray-50" : "cursor-pointer"
      )}
      style={{
        outline: isSelected ? `2px solid ${colors.success500}` : `1px solid ${colors.gray200}`,
      }}
      onClick={() => {
        if (!disabled) {
          onClick();
        }
      }}
    >
      {cloudIcons[cloudProvider]}
      <Text size="small" weight="medium" color={disabled ? "#667085" : "#414651"}>
        {cloudProviderLabels[cloudProvider]}
      </Text>
    </div>
  );
};

type CloudProviderRadioProps = {
  cloudProviders: string[];
  formData: any;
  name: string;
  onChange?: () => void;
  disabled?: boolean;
};

const CloudProviderRadio: React.FC<CloudProviderRadioProps> = ({
  cloudProviders,
  formData,
  name,
  onChange = () => {},
  disabled,
}) => {
  if (!cloudProviders.length) {
    return (
      <div className="flex items-center justify-center h-10">
        <Text size="small" weight="medium" color={colors.gray500}>
          No cloud providers available
        </Text>
      </div>
    );
  }

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cloudProviders.length}, minmax(0, 1fr))` }}>
      {cloudProviders.map((cloudProvider, index) => {
        return (
          <CloudProviderCard
            key={index}
            disabled={disabled}
            cloudProvider={cloudProvider}
            isSelected={formData.values[name]?.toLowerCase() === cloudProvider.toLowerCase()}
            onClick={() => {
              formData.setFieldValue(name, cloudProvider);
              if (formData.values[name] !== cloudProvider) {
                // @ts-ignore
                onChange(cloudProvider);
              }
            }}
          />
        );
      })}
    </div>
  );
};

export default CloudProviderRadio;

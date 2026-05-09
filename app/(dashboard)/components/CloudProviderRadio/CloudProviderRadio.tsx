"use client";

import { cn } from "lib/utils";

import { cloudProviderLongLogoMap } from "src/constants/cloudProviders";
import { colors } from "src/themeConfig";
import { Text } from "components/Typography/Typography";

const CloudProviderCard = ({ cloudProvider, isSelected, onClick, disabled }) => {
  return (
    <div
      data-testid={`${cloudProvider}-card`}
      className={cn(
        "px-4 py-4 rounded-xl text-center flex flex-col justify-center items-center",
        disabled ? "cursor-default bg-gray-50" : "cursor-pointer"
      )}
      style={{
        outline: isSelected ? `2px solid ${colors.success500}` : `1px solid ${colors.gray200}`,
        minWidth: "120px",
        minHeight: "60px",
      }}
      onClick={() => {
        if (!disabled) {
          onClick();
        }
      }}
    >
      <div className="flex items-center justify-center" style={{ height: "28px" }}>
        {cloudProviderLongLogoMap[cloudProvider]}
      </div>
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
  // Filter out cloud providers that don't have a logo/icon defined
  const validCloudProviders = cloudProviders.filter((cp) => cp && cloudProviderLongLogoMap[cp]);

  if (!validCloudProviders.length) {
    return (
      <div className="flex items-center justify-center h-10">
        <Text size="small" weight="medium" color={colors.gray500}>
          No cloud providers available
        </Text>
      </div>
    );
  }

  const columns = Math.min(validCloudProviders.length, 4);

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {validCloudProviders.map((cloudProvider, index) => {
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

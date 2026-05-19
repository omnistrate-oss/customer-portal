"use client";

import { cn } from "lib/utils";

import { cloudProviderLongLogoMap } from "src/constants/cloudProviders";
import { colors } from "src/themeConfig";
import Tooltip from "components/Tooltip/Tooltip";
import { Text } from "components/Typography/Typography";

const CloudProviderCard = ({ cloudProvider, isSelected, onClick, disabled, disabledMessage }) => {
  const card = (
    <div
      data-testid={`${cloudProvider}-card`}
      className={cn(
        "px-4 py-4 rounded-xl text-center flex flex-col justify-center items-center",
        disabled ? "cursor-not-allowed bg-gray-50" : "cursor-pointer"
      )}
      style={{
        outline: isSelected ? `2px solid ${colors.success500}` : `1px solid ${colors.gray200}`,
        minWidth: "120px",
        minHeight: "60px",
        opacity: disabled ? 0.5 : 1,
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

  if (disabled && disabledMessage) {
    return (
      <Tooltip title={disabledMessage} placement="top" arrow>
        <span>{card}</span>
      </Tooltip>
    );
  }

  return card;
};

type CloudProviderRadioProps = {
  cloudProviders: string[];
  formData: any;
  name: string;
  onChange?: () => void;
  disabled?: boolean;
  disabledProviders?: Record<string, string>;
};

const CloudProviderRadio: React.FC<CloudProviderRadioProps> = ({
  cloudProviders,
  formData,
  name,
  onChange = () => {},
  disabled,
  disabledProviders,
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

  return (
    <div className="flex flex-wrap gap-4">
      {validCloudProviders.map((cloudProvider, index) => {
        const providerDisabledMessage = disabledProviders?.[cloudProvider];
        const isProviderDisabled = Boolean(disabled || providerDisabledMessage);

        return (
          <CloudProviderCard
            key={index}
            disabled={isProviderDisabled}
            disabledMessage={providerDisabledMessage}
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

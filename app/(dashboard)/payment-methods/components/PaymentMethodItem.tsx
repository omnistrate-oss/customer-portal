"use client";

import { Box, IconButton, Stack } from "@mui/material";

import DeleteIcon from "src/components/Icons/Delete/Delete";
import StatusChip from "src/components/StatusChip/StatusChip";
import Tooltip from "src/components/Tooltip/Tooltip";
import { colors } from "src/themeConfig";
import { ConsumptionPaymentMethod } from "src/types/consumption";
import Button from "components/Button/Button";
import { Text } from "components/Typography/Typography";

import { getPaymentMethodPrimaryLabel, getPaymentMethodSecondaryLabel } from "../utils/paymentMethodUtils";

import { PaymentMethodIcon } from "./Icons";

type PaymentMethodItemProps = {
  method: ConsumptionPaymentMethod;
  disableActions?: boolean;
  isSettingDefault?: boolean;
  onRemove: (method: ConsumptionPaymentMethod) => void;
  onSetDefault: (method: ConsumptionPaymentMethod) => void;
};

const PaymentMethodItem = ({
  method,
  disableActions,
  isSettingDefault,
  onRemove,
  onSetDefault,
}: PaymentMethodItemProps) => {
  const primaryLabel = getPaymentMethodPrimaryLabel(method);

  return (
    <Box
      sx={{
        border: `1px solid ${colors.gray200}`,
        borderRadius: "8px",
        padding: "14px",
        backgroundColor: "#FFFFFF",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap="16px" minHeight="40px">
        <Stack direction="row" alignItems="center" gap="16px" minWidth={0}>
          <PaymentMethodIcon method={method} />
          <Box minWidth={0}>
            <Stack direction="row" alignItems="center" gap="8px" flexWrap="wrap">
              <Text size="small" weight="medium" color={colors.gray700} ellipsis maxWidth="320px">
                {primaryLabel}
              </Text>
              {method.isDefault && <StatusChip label="Default" category="success" />}
            </Stack>
            <Text size="small" weight="regular" color={colors.gray700}>
              {getPaymentMethodSecondaryLabel(method)}
            </Text>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" gap="8px" flexShrink={0}>
          {!method.isDefault && (
            <Button
              variant="outlined"
              size="small"
              disabled={disableActions}
              isLoading={isSettingDefault}
              onClick={() => onSetDefault(method)}
            >
              Set default
            </Button>
          )}
          <Tooltip title="Remove payment method">
            <span>
              <IconButton
                size="small"
                disabled={disableActions}
                aria-label={`Remove ${primaryLabel}`}
                onClick={() => onRemove(method)}
                sx={{
                  border: `1px solid ${disableActions ? colors.gray200 : colors.error300}`,
                  borderRadius: "8px",
                  width: 36,
                  height: 36,
                }}
              >
                <DeleteIcon color={colors.error700} disabled={disableActions} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  );
};

export default PaymentMethodItem;

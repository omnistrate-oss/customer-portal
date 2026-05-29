"use client";

import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import { Box, IconButton, Stack } from "@mui/material";

import DeleteIcon from "src/components/Icons/Delete/Delete";
import StatusChip from "src/components/StatusChip/StatusChip";
import Tooltip from "src/components/Tooltip/Tooltip";
import { colors } from "src/themeConfig";
import { ConsumptionPaymentMethod } from "src/types/consumption";
import Button from "components/Button/Button";
import { Text } from "components/Typography/Typography";

import { getPaymentMethodPrimaryLabel, getPaymentMethodSecondaryLabel } from "../utils/paymentMethodUtils";

type PaymentMethodItemProps = {
  method: ConsumptionPaymentMethod;
  disableActions?: boolean;
  isSettingDefault?: boolean;
  onRemove: (method: ConsumptionPaymentMethod) => void;
  onSetDefault: (method: ConsumptionPaymentMethod) => void;
};

const bankMethodTypes = new Set(["us_bank_account", "sepa_debit", "bacs_debit", "au_becs_debit"]);

const PaymentMethodItem = ({
  method,
  disableActions,
  isSettingDefault,
  onRemove,
  onSetDefault,
}: PaymentMethodItemProps) => {
  const Icon = bankMethodTypes.has(method.type) ? AccountBalanceIcon : CreditCardIcon;
  const primaryLabel = getPaymentMethodPrimaryLabel(method);

  return (
    <Box
      sx={{
        border: `1px solid ${colors.gray200}`,
        borderRadius: "8px",
        padding: "14px 16px",
        backgroundColor: "#FFFFFF",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap="16px">
        <Stack direction="row" alignItems="center" gap="12px" minWidth={0}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.gray50,
              border: `1px solid ${colors.gray200}`,
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: 20, color: colors.gray600 }} />
          </Box>
          <Box minWidth={0}>
            <Stack direction="row" alignItems="center" gap="8px" flexWrap="wrap">
              <Text size="small" weight="semibold" color={colors.gray900} ellipsis maxWidth="320px">
                {primaryLabel}
              </Text>
              {method.isDefault && <StatusChip label="Default" category="success" />}
            </Stack>
            <Text size="xsmall" weight="regular" color={colors.gray500} sx={{ mt: "4px" }}>
              {getPaymentMethodSecondaryLabel(method)}
            </Text>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" gap="8px" flexShrink={0}>
          {!method.isDefault && (
            <Button
              variant="text"
              size="small"
              fontColor={colors.success700}
              disabled={disableActions}
              isLoading={isSettingDefault}
              onClick={() => onSetDefault(method)}
              sx={{ px: "8px" }}
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

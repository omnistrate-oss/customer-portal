import Link from "next/link";

import { Field } from "src/components/DynamicForm/types";
import MenuItem from "src/components/FormElementsv2/MenuItem/MenuItem";
import Select from "src/components/FormElementsv2/Select/Select";
import SubscriptionTypeDirectIcon from "src/components/Icons/SubscriptionType/SubscriptionTypeDirectIcon";
import SubscriptionTypeInvitedIcon from "src/components/Icons/SubscriptionType/SubscriptionTypeInvitedIcon";
import { Text } from "src/components/Typography/Typography";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { Subscription } from "src/types/subscription";
import { getBillingRoute } from "src/utils/routes";

type SubscriptionMenuProps = {
  formData: any;
  field: Omit<Field, "label" | "subLabel">;
  subscriptions: Subscription[];
  subscriptionInstanceCountHash: Record<string, number>;
};

const SubscriptionMenu: React.FC<SubscriptionMenuProps> = ({
  formData,
  field,
  subscriptions,
  subscriptionInstanceCountHash = {},
}) => {
  const { values, touched, errors, handleChange, handleBlur } = formData;
  const { serviceOfferingsObj } = useGlobalData();

  return (
    <Select
      isLoading={field.isLoading}
      id={field.name}
      name={field.name}
      value={field.value || values[field.name] || ""}
      onBlur={(e) => {
        field.onBlur?.(e);
        handleBlur(e);
      }}
      onChange={(e) => {
        field.onChange?.(e);
        handleChange(e);
      }}
      error={Boolean(touched[field.name] && errors[field.name])}
      disabled={field.disabled}
      sx={{ mt: 0 }}
    >
      {subscriptions?.length > 0 ? (
        subscriptions.map((subscription) => {
          const plan = serviceOfferingsObj?.[subscription.serviceId]?.[subscription.productTierId] || {};
          const limit = subscription.maxNumberOfInstances ?? plan.maxNumberOfInstances ?? Infinity;
          const isInstanceLimitReached = (subscriptionInstanceCountHash[subscription.id] ?? 0) >= limit;

          const hasPaymentIssue =
            !subscription.paymentMethodConfigured &&
            !(subscription.allowCreatesWhenPaymentNotConfigured ?? plan.allowCreatesWhenPaymentNotConfigured);

          const isDisabled =
            !["editor", "root"].includes(subscription.roleType) || isInstanceLimitReached || hasPaymentIssue;

          let disabledMessage: string | React.ReactNode = "";
          if (subscription.roleType === "reader") {
            disabledMessage = "Readers cannot create instances";
          } else if (isInstanceLimitReached) {
            disabledMessage = "Instance limit reached";
          } else if (hasPaymentIssue) {
            if (subscription.roleType !== "root") {
              disabledMessage = "Payment configuration required for subscription onwer";
            } else {
              disabledMessage = (
                <>
                  Payment configuration required.{" "}
                  <Link
                    onClick={(e) => e.stopPropagation()}
                    className="underline underline-offset-2 pointer-events-auto"
                    href={getBillingRoute()}
                  >
                    Click here
                  </Link>{" "}
                  to configure
                </>
              );
            }
          }

          const role = subscription.roleType;

          const menuItem = (
            <MenuItem
              key={subscription.id}
              value={subscription.id}
              disabled={isDisabled}
              sx={{
                "&.Mui-disabled:hover": {
                  backgroundColor: "transparent",
                },
              }}
            >
              <div className="flex items-center gap-2">
                {role === "root" ? <SubscriptionTypeDirectIcon /> : <SubscriptionTypeInvitedIcon />}
                {subscription.id} ({role && role.charAt(0).toUpperCase() + role.slice(1)})
                {isDisabled && (
                  <Text size="small" weight="regular" color="#DC6803">
                    {" "}
                    {disabledMessage}
                  </Text>
                )}
              </div>
            </MenuItem>
          );

          return menuItem;
        })
      ) : (
        <MenuItem value="" disabled>
          <i>{field.emptyMenuText || "No Options"}</i>
        </MenuItem>
      )}
    </Select>
  );
};

export default SubscriptionMenu;

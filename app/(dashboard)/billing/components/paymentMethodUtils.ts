import { ConsumptionPaymentMethod } from "src/types/consumption";

export const getPaymentMethodTypeLabel = (type: string) => {
  return type
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const getPaymentMethodPrimaryLabel = (method: ConsumptionPaymentMethod) => {
  if (method.displayName) {
    return method.displayName;
  }

  if (method.brand && method.last4) {
    return `${method.brand} ending in ${method.last4}`;
  }

  if (method.bankName && method.last4) {
    return `${method.bankName} ending in ${method.last4}`;
  }

  if (method.last4) {
    return `${getPaymentMethodTypeLabel(method.type)} ending in ${method.last4}`;
  }

  return getPaymentMethodTypeLabel(method.type);
};

export const getPaymentMethodSecondaryLabel = (method: ConsumptionPaymentMethod) => {
  const parts = [getPaymentMethodTypeLabel(method.type)];

  if (method.expMonth && method.expYear) {
    parts.push(`Expires ${String(method.expMonth).padStart(2, "0")}/${method.expYear}`);
  }

  if (method.bankName && !method.displayName?.includes(method.bankName)) {
    parts.push(method.bankName);
  }

  return parts.join(" · ");
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  const maybeError = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
    message?: string;
  };

  return maybeError?.response?.data?.message || maybeError?.message || fallback;
};

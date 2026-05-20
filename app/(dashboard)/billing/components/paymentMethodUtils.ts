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
      status?: number;
      data?: {
        message?: string;
        name?: string;
      };
    };
    message?: string;
  };

  const status = maybeError?.response?.status;
  const backendMessage = maybeError?.response?.data?.message || maybeError?.message || "";
  const message = backendMessage.toLowerCase();

  if (status === 401) {
    return "Your session has expired. Sign in again to manage payment methods.";
  }

  if (status === 403) {
    return "You do not have permission to manage payment methods.";
  }

  if (message.includes("unpaid invoice") || message.includes("open invoice")) {
    return "Resolve unpaid invoices before removing this payment method.";
  }

  if (message.includes("current month usage") || message.includes("current-month usage")) {
    return "Add another payment method before removing this one because this billing account has current-month usage.";
  }

  if (
    message.includes("active subscription") ||
    message.includes("active instance") ||
    message.includes("active resource")
  ) {
    return "Add another payment method before removing this one because active subscriptions require a payment method.";
  }

  if (message.includes("last payment method") || message.includes("last method")) {
    return "Add another payment method before removing this one.";
  }

  if (status === 404 && message.includes("billing")) {
    return "Billing is not configured for this account.";
  }

  if (status === 409) {
    return "This payment method cannot be changed right now. Resolve pending billing items or add another payment method first.";
  }

  if (status === 429) {
    return "Payment method requests are temporarily rate limited. Wait a few seconds, then try again.";
  }

  return fallback;
};

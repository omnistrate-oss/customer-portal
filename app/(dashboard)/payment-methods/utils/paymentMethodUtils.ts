import { ConsumptionPaymentMethod } from "src/types/consumption";

export const getPaymentMethodPrimaryLabel = (method: ConsumptionPaymentMethod) => {
  return method.displayName;
};

export const getPaymentMethodSecondaryLabel = (method: ConsumptionPaymentMethod) => {
  if (!method.expMonth || !method.expYear) {
    return "";
  }

  return `Expires ${String(method.expMonth).padStart(2, "0")}/${method.expYear}`;
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

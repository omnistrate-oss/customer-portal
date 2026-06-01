const DEFAULT_BILLING_DETAILS_ERROR_MESSAGE =
  "Something went wrong. Try refreshing the page. If the issue persists please contact support for assistance";

const getBillingErrorMessage = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const response = "response" in error ? error.response : undefined;
  if (!response || typeof response !== "object") {
    return undefined;
  }

  const data = "data" in response ? response.data : undefined;
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const message = "message" in data ? data.message : undefined;
  return typeof message === "string" ? message : undefined;
};

const getBillingDetailsErrorMessage = (error: unknown) => {
  const errorMessage = getBillingErrorMessage(error);

  if (!errorMessage) {
    return DEFAULT_BILLING_DETAILS_ERROR_MESSAGE;
  }

  if (
    errorMessage === "Your provider has not enabled billing for the user." ||
    errorMessage === "Your provider has not enabled billing for the services."
  ) {
    return "Billing has not been configured. Please contact support for assistance";
  }

  if (errorMessage === "You have not been subscribed to a service yet.") {
    return "Please subscribe to a Product to start using billing";
  }

  if (errorMessage === "You have not been enrolled in a service plan with a billing plan yet.") {
    return "You have not been enrolled in a plan with a billing plan. Please contact support for assistance";
  }

  return errorMessage;
};

export default getBillingDetailsErrorMessage;

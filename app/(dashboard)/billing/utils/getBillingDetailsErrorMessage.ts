const DEFAULT_BILLING_DETAILS_ERROR_MESSAGE =
  "Something went wrong. Try refreshing the page. If the issue persists please contact support for assistance";

const getBillingErrorMessage = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const response = "response" in error ? error.response : undefined;
  const data = response && typeof response === "object" && "data" in response ? response.data : undefined;
  const body = data && typeof data === "object" ? data : error;
  const message = "message" in body ? body.message : undefined;
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

  return DEFAULT_BILLING_DETAILS_ERROR_MESSAGE;
};

export default getBillingDetailsErrorMessage;

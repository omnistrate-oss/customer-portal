import * as yup from "yup";

export const CloudAccountValidationSchema = yup.object({
  serviceId: yup.string().required("Product ID is required"),
  servicePlanId: yup.string().required("Subscription Plan ID is required"),
  subscriptionId: yup.string().required("Subscription ID is required"),
  cloudProvider: yup.string().required("Cloud Provider is required"),
  accountConfigurationMethod: yup.string().required("Account Configuration Method is required"),
  awsAccountId: yup.string().when("cloudProvider", {
    is: "aws",
    then: yup
      .string()
      .required("AWS Account ID is required")
      .matches(/^\d{12}$/, "AWS Account ID must be a 12-digit number (e.g., 012345678901)"), // Must be exactly 12 digits (leading zeros allowed)
  }),
  gcpProjectId: yup.string().when("cloudProvider", {
    is: "gcp",
    then: yup
      .string()
      .required("GCP Project ID is required")
      .matches(
        /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/,
        "GCP Project ID must be 6-30 characters, start with a letter, end with a letter or number, and contain only lowercase letters, numbers, and hyphens"
      )
      .test("no-restricted-words", "GCP Project ID cannot contain restricted strings such as google or ssl", (value) =>
        value ? !/(google|ssl)/.test(value) : true
      ),
  }),
  gcpProjectNumber: yup.string().when("cloudProvider", {
    is: "gcp",
    then: yup
      .string()
      .required("GCP Project Number is required")
      .matches(/^\d+$/, "GCP Project Number must be a number"),
  }),
  azureSubscriptionId: yup.string().when("cloudProvider", {
    is: "azure",
    then: yup
      .string()
      .required("Azure Subscription ID is required")
      .matches(
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
        "Azure Subscription ID must be a GUID: 32 hexadecimal characters in 5 groups (8-4-4-4-12) separated by hyphens (e.g., 123e4567-e89b-12d3-a456-42661ea7400e)"
      ),
    otherwise: yup.string(),
  }),
  azureTenantId: yup.string().when("cloudProvider", {
    is: "azure",
    then: yup
      .string()
      .required("Azure Tenant ID is required")
      .matches(
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
        "Azure Tenant ID must be a GUID: 32 hexadecimal characters in 5 groups (8-4-4-4-12) separated by hyphens (e.g., 123e4567-e89b-12d3-a456-42661ea7400e)"
      ),
    otherwise: yup.string(),
  }),
});

export const cloudAccountOffboardingSteps = [
  {
    label: "Initiate Deletion",
    description: "Complete Offboarding",
  },
  {
    label: "Confirm Deletion",
    description: "Confirm Offboarding",
  },
];

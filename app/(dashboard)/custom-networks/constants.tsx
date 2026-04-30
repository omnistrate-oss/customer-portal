import * as yup from "yup";

export const CustomNetworkValidationSchema = yup.object({
  cidr: yup.string().required("CIDR is required"),
  cloudProviderName: yup.string().required("Cloud Provider is required"),
  cloudProviderRegion: yup.string().required("Region is required"),
  name: yup.string().required("Name is required"),
  shareViaSubscriptionOwner: yup.boolean(),
  subscriptionOwnerId: yup.string().when("shareViaSubscriptionOwner", {
    is: true,
    then: (schema) => schema.required("Subscription Owner is required"),
    otherwise: (schema) => schema.optional(),
  }),
});

import * as yup from "yup";

import { getSubscriptionUserInviteRoleOptions } from "src/utils/consumptionSubscriptionAdminRBAC";

export const getInviteUsersValidationSchema = (roleOptions = getSubscriptionUserInviteRoleOptions()) =>
  yup.object().shape({
    userInvite: yup
      .array()
      .of(
        yup.object().shape({
          email: yup.string().required("Email is required").email("Please enter a valid email address").trim(),
          roleType: yup.string().required("Role is required").oneOf(roleOptions, "Please select a valid role"),
          serviceId: yup.string().required("Service is required"),
          servicePlanId: yup.string().required("Subscription plan is required"),
        })
      )
      .min(1, "At least one user invite is required"),
  });

export const inviteUsersValidationSchema = getInviteUsersValidationSchema();

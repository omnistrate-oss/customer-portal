import axios from "../axios";

export const revokeSubscriptionUser = (subscriptionId, payload) =>
  axios.delete(
    `/resource-instance/subscription/${subscriptionId}/revoke-user-role`,
    {
      data: payload,
    }
  );

export const inviteSubscriptionUser = (subscriptionId, payload) =>
  axios.post(
    `/resource-instance/subscription/${subscriptionId}/invite-user`,
    payload
  );

export const getUsersBySubscription = (subscriptionId) =>
  axios.get(
    `/resource-instance/subscription/${subscriptionId}/subscription-users`
  );

export const updateProfile = async (userId, data) => {
  return axios.patch(`/user/${userId}`, data);
};

export const updatePassword = (payload) => {
  return axios.post(`/update-password`, payload);
};

export const getBillingDetails = (userId) => {
  return axios.get(`/resource-instance/user/${userId}/billing-details`);
};

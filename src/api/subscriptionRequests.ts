import axios from "../axios";

export const getSubscriptionRequest = (requestId: string) => {
  return axios.get(`/subscription/request/${requestId}`);
};

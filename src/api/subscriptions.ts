import axios from "../axios";

export const getSubscription = (subId) => {
  return axios.get(`/subscription/${subId}`);
};

export const deleteSubscription = (subId) => {
  return axios.delete(`/subscription/${subId}`);
};

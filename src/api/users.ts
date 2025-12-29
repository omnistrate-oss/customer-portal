import { AxiosResponse } from "axios";

import axios from "../axios";

export const inviteSubscriptionUser = (subscriptionId, payload, suppressErrorSnackbar = false) =>
  axios.post(`/resource-instance/subscription/${subscriptionId}/invite-user`, payload, {
    ignoreGlobalErrorSnack: suppressErrorSnackbar,
  });

export const deleteUser = (): Promise<AxiosResponse<any>> => {
  return axios.delete(`/customer-delete-user`);
};

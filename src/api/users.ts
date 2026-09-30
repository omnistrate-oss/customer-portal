import { AxiosResponse } from "axios";

import axios from "../axios";

export const deleteUser = (): Promise<AxiosResponse<any>> => {
  return axios.delete(`/customer-delete-user`);
};

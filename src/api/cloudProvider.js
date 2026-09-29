import axios from "src/axios";

export const getCloudProviders = () => {
  return axios.get("/api/cloud-providers", { baseURL: "" });
};

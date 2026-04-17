import axios from "../axios";

export const downloadCLI = (serviceId, serviceApiId) => {
  return axios.get(`/api/download-cli`, {
    baseURL: "",
    params: { serviceId, serviceApiId },
    responseType: "blob",
  });
};

export const getServiceApiDocs = (serviceId, serviceApiId) => {
  return axios.get(`/service/${serviceId}/service-api/${serviceApiId}/swagger_spec`);
};

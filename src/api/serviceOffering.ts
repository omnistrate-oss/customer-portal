import { AxiosResponse } from "axios";

import { EnvironmentType } from "src/types/common/enums";
import {
  DescribeServiceOfferingResourceSuccessResponse,
  ListServiceOfferingSuccessResponse,
} from "src/types/serviceOffering";

import axios from "../axios";

export const getServiceOffering = (serviceId: string, environmentType: EnvironmentType) => {
  const queryParams = {};
  if (environmentType) {
    queryParams["environmentType"] = environmentType;
  }

  return axios.get(`/service-offering/${serviceId}`, {
    params: queryParams,
  });
};

export const describeServiceOfferingResource = (
  serviceId: string,
  resourceId: string,
  instanceId = "none",
  productTierId?: string,
  productTierVersion?: string
): Promise<AxiosResponse<DescribeServiceOfferingResourceSuccessResponse>> => {
  const queryParams: Record<string, string> = {};

  if (productTierVersion && productTierId) {
    queryParams["productTierId"] = productTierId;
    queryParams["productTierVersion"] = productTierVersion;
  }
  return axios.get(`/service-offering/${serviceId}/resource/${resourceId}/instance/${instanceId}`, {
    params: queryParams,
  });
};

export const listServiceOfferings = (query): Promise<AxiosResponse<ListServiceOfferingSuccessResponse>> => {
  return axios.get("/service-offering", {
    params: query,
  });
};

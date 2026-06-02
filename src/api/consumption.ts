import { AxiosResponse } from "axios";

import axios from "src/axios";
import {
  ConsumptionStripeConfigResponse,
  CreateConsumptionSetupIntentSuccessResponse,
  DescribeConsumptionBillingDetailsSuccessResponse,
  DescribeConsumptionBillingStatusResponse,
  GetConsumptionUsagePerDaySuccessResponse,
  GetCurrentConsumptionUsageSuccessResponse,
  ListConsumptionPaymentMethodsSuccessResponse,
} from "src/types/consumption";

export type GetConsumptionUsageQueryParams = {
  subscriptionID?: string;
};

export const getConsumptionUsage = (
  queryParams: GetConsumptionUsageQueryParams = {}
): Promise<AxiosResponse<GetCurrentConsumptionUsageSuccessResponse>> => {
  return axios.get("/resource-instance/usage", {
    params: queryParams,
    ignoreGlobalErrorSnack: true,
  });
};

export type GetConsumptionUsagePerDayQueryParams = {
  subscriptionID?: string;
  startDate?: string;
  endDate?: string;
};

export const getConsumptionUsagePerDay = (
  queryParams: GetConsumptionUsagePerDayQueryParams = {}
): Promise<AxiosResponse<GetConsumptionUsagePerDaySuccessResponse>> => {
  return axios.get("/resource-instance/usage-per-day", {
    params: queryParams,
  });
};

export const getConsumptionBillingStatus = (): Promise<AxiosResponse<DescribeConsumptionBillingStatusResponse>> => {
  return axios.get("/resource-instance/billing-status", {
    ignoreGlobalErrorSnack: true,
  });
};

export type GetBillingDetailsQueryParams = {
  returnUrl: string;
  supportsCustomPaymentPortal?: boolean;
};

export const getBillingDetails = (
  queryParams: GetBillingDetailsQueryParams
): Promise<AxiosResponse<DescribeConsumptionBillingDetailsSuccessResponse>> => {
  return axios.get("/resource-instance/billing-details", {
    params: queryParams,
    ignoreGlobalErrorSnack: true,
  });
};

export const getConsumptionStripeConfig = (): Promise<AxiosResponse<ConsumptionStripeConfigResponse>> => {
  return axios.get("/resource-instance/billing/stripe/config", {
    ignoreGlobalErrorSnack: true,
  });
};

export const listConsumptionPaymentMethods = (): Promise<
  AxiosResponse<ListConsumptionPaymentMethodsSuccessResponse>
> => {
  return axios.get("/resource-instance/billing/stripe/payment-methods", {
    ignoreGlobalErrorSnack: true,
  });
};

export const createConsumptionSetupIntent = (): Promise<AxiosResponse<CreateConsumptionSetupIntentSuccessResponse>> => {
  return axios.post(
    "/resource-instance/billing/stripe/payment-methods/setup-intent",
    {},
    {
      ignoreGlobalErrorSnack: true,
    }
  );
};

export const removeConsumptionPaymentMethod = (id: string): Promise<AxiosResponse<void>> => {
  return axios.delete(`/resource-instance/billing/stripe/payment-methods/${id}`, {
    ignoreGlobalErrorSnack: true,
  });
};

export const setDefaultConsumptionPaymentMethod = (id: string): Promise<AxiosResponse<void>> => {
  return axios.post(
    `/resource-instance/billing/stripe/payment-methods/${id}/default`,
    {},
    {
      ignoreGlobalErrorSnack: true,
    }
  );
};

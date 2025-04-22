import { request } from "@playwright/test";

import { GlobalStateManager } from "./global-state-manager";

import { Subscription } from "src/types/subscription";
import { ServiceOffering } from "src/types/serviceOffering";
import { CreateResourceInstancePayload, ResourceInstance } from "src/types/resourceInstance";

export class UserAPIClient {
  baseURL = `${process.env.NEXT_PUBLIC_BACKEND_BASE_DOMAIN}`;
  apiVersion = "2022-09-01-00";

  async userLogin(email: string, password: string) {
    const context = await request.newContext({ baseURL: process.env.YOUR_SAAS_DOMAIN_URL });
    const response = await context.post("/api/signin", {
      data: { email, password },
    });

    const data = await response.json();
    const token = data.jwtToken;

    if (!token) {
      throw new Error("Failed to login");
    }

    GlobalStateManager.setState({ userToken: token });
    return token;
  }

  async createUserRequest() {
    const token = GlobalStateManager.getToken("user");

    if (!token) {
      throw new Error("User token not found");
    }

    return request.newContext({
      baseURL: this.baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
  }

  async createInstance(
    serviceProviderId: string,
    serviceKey: string,
    serviceAPIVersion: string,
    serviceEnvironmentKey: string,
    serviceModelKey: string,
    productTierKey: string,
    resourceKey: string,
    subscriptionId: string,
    payload: CreateResourceInstancePayload
  ) {
    const context = await this.createUserRequest();
    const response = await context.post(
      `/${this.apiVersion}/resource-instance/${serviceProviderId}/${serviceKey}/${serviceAPIVersion}/${serviceEnvironmentKey}/${serviceModelKey}/${productTierKey}/${resourceKey}?subscriptionId=${subscriptionId}`,
      { data: payload }
    );

    if (!response.ok()) {
      console.error("Failed to create resource instance", await response.json());
      throw new Error("Failed to create resource instance");
    }

    const instanceId = (await response.json()).id;
    const instanceResponse = await context.get(
      `/${this.apiVersion}/resource-instance/${serviceProviderId}/${serviceKey}/${serviceAPIVersion}/${serviceEnvironmentKey}/${serviceModelKey}/${productTierKey}/${resourceKey}/${instanceId}?subscriptionId=${subscriptionId}`
    );

    if (!instanceResponse.ok()) {
      throw new Error("Failed to get instance data");
    }

    const instance = await instanceResponse.json();

    return instance as ResourceInstance;
  }

  async listServiceOffering() {
    const context = await this.createUserRequest();
    const response = await context.get(
      `/${this.apiVersion}/service-offering?environmentType=${process.env.ENVIRONMENT_TYPE}`
    );

    if (!response.ok()) {
      throw new Error("Failed to list service offerings");
    }

    const services = (await response.json()).services;
    const serviceOfferings: ServiceOffering[] = [];

    // Include only Playwright Services
    services.forEach((service) => {
      service.offerings.forEach((offering) => {
        const offeringData = {
          ...service,
          ...offering,
        };

        delete offeringData.offerings;
        serviceOfferings.push(offeringData);
      });
    });

    // @ts-ignore
    serviceOfferings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return serviceOfferings;
  }

  async listResourceInstances() {
    const context = await this.createUserRequest();
    const response = await context.get(`/${this.apiVersion}/resource-instance`);

    if (!response.ok()) {
      throw new Error("Failed to list resource instances");
    }

    const instances = (await response.json()).resourceInstances;
    return instances as ResourceInstance[];
  }

  async describeResourceInstance(
    serviceProviderId: string,
    serviceKey: string,
    serviceAPIVersion: string,
    serviceEnvironmentKey: string,
    serviceModelKey: string,
    productTierKey: string,
    resourceKey: string,
    instanceId: string,
    subscriptionId: string
  ) {
    const context = await this.createUserRequest();
    const response = await context.get(
      `/${this.apiVersion}/resource-instance/${serviceProviderId}/${serviceKey}/${serviceAPIVersion}/${serviceEnvironmentKey}/${serviceModelKey}/${productTierKey}/${resourceKey}/${instanceId}`,
      {
        params: {
          subscriptionId,
        },
      }
    );

    if (!response.ok()) {
      throw new Error("Failed to describe resource instance");
    }

    return response.json();
  }

  async deleteResourceInstance(
    serviceProviderId: string,
    serviceKey: string,
    serviceAPIVersion: string,
    serviceEnvironmentKey: string,
    serviceModelKey: string,
    productTierKey: string,
    resourceKey: string,
    instanceId: string,
    subscriptionId: string
  ) {
    const context = await this.createUserRequest();
    await context.delete(
      `/${this.apiVersion}/resource-instance/${serviceProviderId}/${serviceKey}/${serviceAPIVersion}/${serviceEnvironmentKey}/${serviceModelKey}/${productTierKey}/${resourceKey}/${instanceId}`,
      {
        params: {
          subscriptionId,
        },
      }
    );
  }

  async describeSubscription(subscriptionId?: string): Promise<Subscription> {
    if (!subscriptionId) {
      throw new Error("Subscription ID is required");
    }

    const context = await this.createUserRequest();
    const response = await context.get(`/${this.apiVersion}/subscription/${subscriptionId}`);

    if (!response.ok()) {
      throw new Error("Failed to describe subscription");
    }

    return response.json();
  }
}

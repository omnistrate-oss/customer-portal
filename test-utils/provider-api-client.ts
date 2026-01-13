import { request } from "@playwright/test";

import { getEnvironmentType } from "src/server/utils/getEnvironmentType";
import { getSaaSDomainURL } from "src/server/utils/getSaaSDomainURL";
import { IdentityProvider } from "src/types/identityProvider";
import { ResourceInstance } from "src/types/resourceInstance";
import { Service } from "src/types/service";

import { GlobalStateManager } from "./global-state-manager";

export class ProviderAPIClient {
  baseURL = `${process.env.NEXT_PUBLIC_BACKEND_BASE_DOMAIN}`;
  apiVersion = "2022-09-01-00";

  async providerLogin(email: string, password: string) {
    const context = await request.newContext({ baseURL: this.baseURL, timeout: 60000 });
    const response = await context.post(`/${this.apiVersion}/signin`, {
      data: { email, password },
    });

    const data = await response.json();
    const token = data.jwtToken;

    if (!token) {
      throw new Error("Failed to login");
    }

    GlobalStateManager.setState({ providerToken: token });
    return token;
  }

  async createProviderRequest() {
    const token = GlobalStateManager.getToken("provider");

    if (!token) {
      throw new Error("Provider token not found");
    }

    return request.newContext({
      baseURL: this.baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      timeout: 60000,
    });
  }

  async listSaaSBuilderServices() {
    const context = await this.createProviderRequest();
    const response = await context.get(`/${this.apiVersion}/service`);

    if (!response.ok()) {
      console.error(await response.json());
      throw new Error("Failed to list services");
    }

    const services: Service[] = (await response.json()).services;
    return services.filter((service) => service.name.startsWith("SaaSBuilder "));
  }

  async createServiceFromComposeSpec(
    name: string,
    description: string,
    fileContent: string,
    environmentType = "DEV",
    environmentName = "Dev",
    filename = "service.yaml",
    fileFormat = "yaml"
  ) {
    const context = await this.createProviderRequest();
    const response = await context.post(`/${this.apiVersion}/service/composespec`, {
      data: { name, description, fileContent, environmentType, environmentName, filename, fileFormat },
    });

    if (!response.ok()) {
      console.error(await response.json());
      throw new Error("Failed to create service");
    }
  }

  async createServiceFromServicePlanSpec(name: string, description: string, fileContent: string) {
    const context = await this.createProviderRequest();
    const response = await context.put(`/${this.apiVersion}/service/serviceplanspec`, {
      data: { name, description, fileContent },
    });

    if (!response.ok()) {
      console.error(await response.json());
      throw new Error("Failed to create service");
    }
  }

  async deleteService(serviceId: string) {
    const context = await this.createProviderRequest();
    const response = await context.delete(`/${this.apiVersion}/service/${serviceId}`);

    if (!response.ok()) {
      console.error(await response.json());
    }
  }

  async getIdentityProviders(): Promise<IdentityProvider[]> {
    const context = await this.createProviderRequest();
    const response = await context.get(`/${this.apiVersion}/identity-provider-render`, {
      params: {
        environmentType: getEnvironmentType(),
        redirectUrl: `${getSaaSDomainURL()}/idp-auth`,
      },
    });

    if (!response.ok()) {
      console.error(await response.json());
      throw new Error("Failed to get identity providers");
    }

    const identityProviders: IdentityProvider[] = (await response.json()).identityProviders || [];
    return identityProviders;
  }

  async listInstances(serviceId: string, environmentId: string) {
    const context = await this.createProviderRequest();
    const response = await context.get(
      `/${this.apiVersion}/fleet/service/${serviceId}/environment/${environmentId}/instances/`
    );

    if (!response.ok()) {
      console.error(await response.json());
      throw new Error("Failed to list instances");
    }

    const instances: { consumptionResourceInstanceResult: ResourceInstance }[] = (await response.json())
      .resourceInstances;
    return instances.map((el) => el.consumptionResourceInstanceResult);
  }

  async deleteInstance(serviceId: string, environmentId: string, instanceId: string, resourceId: string) {
    const context = await this.createProviderRequest();
    const response = await context.delete(
      `/${this.apiVersion}/fleet/service/${serviceId}/environment/${environmentId}/instance/${instanceId}`,
      {
        data: { resourceId },
      }
    );

    if (!response.ok()) {
      console.error(await response.json());
      throw new Error("Failed to delete instance");
    }
  }

  async describeInstance(serviceId: string, environmentId: string, instanceId: string) {
    const context = await this.createProviderRequest();
    const response = await context.get(
      `/${this.apiVersion}/fleet/service/${serviceId}/environment/${environmentId}/instance/${instanceId}`
    );

    if (!response.ok()) {
      console.error(await response.json());
      throw new Error("Failed to describe instance");
    }

    const instance: ResourceInstance = (await response.json()).consumptionResourceInstanceResult;
    return instance;
  }

  async deleteSubscriptions(serviceId: string, environmentId: string) {
    const context = await this.createProviderRequest();
    const response = await context.get(
      `/${this.apiVersion}/fleet/service/${serviceId}/environment/${environmentId}/subscription`
    );

    if (!response.ok()) {
      console.error(await response.json());
      throw new Error("Failed to list subscriptions");
    }

    const subscriptionIds: string[] = (await response.json()).ids || [];
    for (const subscriptionId of subscriptionIds) {
      await context.delete(
        `/${this.apiVersion}/fleet/service/${serviceId}/environment/${environmentId}/subscription/${subscriptionId}`
      );
    }
  }
}

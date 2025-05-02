import { request } from "@playwright/test";

import { GlobalStateManager } from "./global-state-manager";

import { Service } from "src/types/service";

export class ProviderAPIClient {
  baseURL = `${process.env.NEXT_PUBLIC_BACKEND_BASE_DOMAIN}`;
  apiVersion = "2022-09-01-00";

  async providerLogin(email: string, password: string) {
    const context = await request.newContext({ baseURL: this.baseURL });
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
    return context.delete(`/${this.apiVersion}/service/${serviceId}`);
  }
}

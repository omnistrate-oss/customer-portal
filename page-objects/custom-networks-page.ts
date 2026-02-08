import { Page } from "@playwright/test";

import { PageURLs } from "./pages";

export class CustomNetworksPage {
  page: Page;

  dataTestIds = {
    refreshButton: "refresh-button",
    modifyButton: "modify-button",
    deleteButton: "delete-button",
    peeringInfoButton: "peering-info-button",
    createButton: "create-button",

    // Form Elements
    nameInput: "name-input",
    awsCard: "aws-card",
    gcpCard: "gcp-card",
    azureCard: "azure-card",
    ociCard: "oci-card",
    regionSelect: "region-select",
    cidrInput: "cidr-input",
  };

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto(PageURLs.customNetworks);
  }
}

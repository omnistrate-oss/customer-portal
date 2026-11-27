import type { Locator, Page } from "@playwright/test";

import { PageURLs } from "./pages";

export class AuditLogsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(): Promise<void> {
    await this.page.goto(PageURLs.auditLogs);
  }

  rowWithMessage(message: string): Locator {
    return this.page.getByRole("row").filter({ hasText: message });
  }

  async expandEvent(id: string): Promise<Locator> {
    await this.page.getByRole("button", { name: new RegExp(`Expand audit event ${id}`) }).click();
    return this.page.getByRole("region", { name: new RegExp(`Audit event details for ${id}`) });
  }
}

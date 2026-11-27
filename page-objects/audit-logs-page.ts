import type { Locator, Page } from "@playwright/test";

import { auditLogsTestIds } from "src/constants/testIds/audit-logs";

import { PageURLs } from "./pages";

export class AuditLogsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(): Promise<void> {
    await this.page.goto(PageURLs.auditLogs);
  }

  row(eventId: string): Locator {
    return this.page.getByTestId(auditLogsTestIds.row(eventId));
  }

  async expandEvent(id: string): Promise<Locator> {
    await this.row(id)
      .getByRole("button", { name: `Expand audit event ${id}` })
      .click();
    return this.page.getByRole("region", { name: `Audit event details for ${id}` });
  }
}

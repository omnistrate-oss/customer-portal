export type EventType = "Customer" | "Infra" | "Maintenance" | "Operations";

export type AccessEvent = {
  environmentId?: string;
  id: string;
  instanceId: string;
  resourceInstanceId?: string;
  message: string;
  orgId?: string;
  orgName?: string;
  resourceName: string;
  serviceId?: string;
  time: string;
  eventSource?: EventType;
  userId?: string;
  userName?: string;
  workflowFailures?: {
    eventTime: string;
    message: string;
  }[];
};

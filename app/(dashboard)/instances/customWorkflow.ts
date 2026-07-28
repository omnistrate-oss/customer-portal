import type { ResourceInstance } from "src/types/resourceInstance";
import type { components } from "src/types/schema";

export const SWITCH_PRIMARY_OPERATION_VERB = "SWITCHPRIMARY";
const CUSTOM_WORKFLOW_SOURCE = "CUSTOM_WORKFLOW";

export type ResourceInstanceSupportedOperation = components["schemas"]["ResourceInstanceSupportedOperation"];
export type InputParameterEntity = components["schemas"]["InputParameterEntity"];

const isOperatorCRDResource = (resourceType?: string) => (resourceType || "").toLowerCase() === "operatorcrd";

const formatWorkflowName = (name?: string) => {
  const normalizedName = (name || "Custom Workflow").replace(/[-_]+/g, " ").trim();
  return normalizedName.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
};

const getResourceOperations = (instance: Pick<ResourceInstance, "supportedOperations"> | undefined) => {
  return (instance?.supportedOperations as ResourceInstanceSupportedOperation[] | undefined) || [];
};

export const getSupportedOperation = (
  instance: Pick<ResourceInstance, "supportedOperations"> | undefined,
  verb: string,
  resourceType?: string
): ResourceInstanceSupportedOperation | undefined => {
  if (!isOperatorCRDResource(resourceType)) {
    return undefined;
  }

  const operations = getResourceOperations(instance);
  if (!operations?.length) {
    return undefined;
  }

  const normalizedVerb = verb.toUpperCase();
  return operations.find((operation) => (operation?.verb || "").toUpperCase() === normalizedVerb);
};

export const getCustomWorkflowOperations = (
  instance: Pick<ResourceInstance, "supportedOperations"> | undefined,
  resourceType?: string
): ResourceInstanceSupportedOperation[] => {
  if (!isOperatorCRDResource(resourceType)) {
    return [];
  }

  return getResourceOperations(instance)
    .filter((operation) => operation?.source?.toUpperCase() === CUSTOM_WORKFLOW_SOURCE && operation?.id)
    .map((operation) => ({
      ...operation,
      name: formatWorkflowName(operation.name),
    }));
};

export const getCustomWorkflowInitialRequestParams = (apiParameters: InputParameterEntity[] = []) => {
  return apiParameters.reduce<Record<string, unknown>>((acc, param) => {
    acc[param.key] = param.defaultValue ?? "";
    return acc;
  }, {});
};

const getParameterValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item && typeof item === "object" && "value" in item) {
        return (item as { value: unknown }).value;
      }
      return item;
    });
  }

  return value;
};

const hasValue = (value: unknown) => {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim() !== "";
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
};

export const normalizeCustomWorkflowRequestParams = (
  requestParams: Record<string, unknown>,
  apiParameters: InputParameterEntity[] = []
) => {
  const normalizedRequestParams: Record<string, unknown> = {};

  apiParameters.forEach((param) => {
    const key = param.key;
    const type = (param.type || "").toLowerCase();
    let value = getParameterValue(requestParams[key]);

    if (!hasValue(value)) {
      return;
    }

    if (typeof value === "string" && !["password", "secret"].includes(type)) {
      value = value.trim();
    }

    switch (type) {
      case "number":
      case "float64": {
        const numberValue = Number(value);
        if (Number.isNaN(numberValue)) {
          throw new Error(`Invalid data in ${param.displayName || key}`);
        }
        normalizedRequestParams[key] = numberValue;
        break;
      }

      case "boolean":
        normalizedRequestParams[key] = typeof value === "boolean" ? value : value === "true";
        break;

      case "json":
      case "any":
        if (typeof value === "string") {
          try {
            normalizedRequestParams[key] = JSON.parse(value);
          } catch {
            throw new Error(`Invalid JSON in ${param.displayName || key}`);
          }
        } else {
          normalizedRequestParams[key] = value;
        }
        break;

      default:
        normalizedRequestParams[key] = value;
    }
  });

  return normalizedRequestParams;
};

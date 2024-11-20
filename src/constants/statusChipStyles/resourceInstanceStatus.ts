import {
  Category,
  ColorObject,
  chipCategoryColors,
  defaultChipStyles,
} from "./index";

export const resourceInstanceStatusMap: Record<
  string,
  { category: Category; label: string }
> = {
  FAILED: { category: "failed", label: "Failed" },
  CANCELLED: { category: "failed", label: "Cancelled" },
  PENDING_DEPENDENCY: { category: "pending", label: "Pending Dependency" },
  PENDING: { category: "pending", label: "Pending" },
  RUNNING: { category: "success", label: "Running" },
  DEPLOYING: { category: "pending", label: "Deploying" },
  READY: { category: "success", label: "Ready" },
  SUCCESS: { category: "success", label: "Success" },
  COMPLETE: { category: "success", label: "Complete" },
  UNKNOWN: { category: "unknown", label: "Unknown" },
  DELETING: { category: "failed", label: "Deleting" },
  DELETED: { category: "failed", label: "Deleted" },
  STOPPED: { category: "failed", label: "Stopped" },
  STOPPING: { category: "inProgress", label: "Stopping" },
  STARTING: { category: "inProgress", label: "Starting" },
  RESTARTING: { category: "inProgress", label: "Restarting" },
  HEALTHY: { category: "success", label: "Healthy" },
  UNHEALTHY: { category: "failed", label: "Unhealthy" },
  SCALING_UP: { category: "inProgress", label: "Scaling Up" },
  SCALING_DOWN: { category: "inProgress", label: "Scaling Down" },
};

export const getResourceInstanceStatusStylesAndLabel = (
  status: string
): ColorObject & { label?: string } => {
  const category = resourceInstanceStatusMap[status]?.category;
  const label = resourceInstanceStatusMap[status]?.label;
  return {
    ...(category ? chipCategoryColors[category] : { ...defaultChipStyles }),
    ...(label ? { label } : {}),
  };
};

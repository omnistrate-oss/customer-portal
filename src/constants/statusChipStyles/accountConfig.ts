import { Category, chipCategoryColors, ColorObject, defaultChipStyles } from "./index";

const accountConfigStatusMap: Record<string, { category: Category; label: string }> = {
  PENDING: { category: "pending", label: "Pending" },
  VERIFYING: { category: "pending", label: "Verifying" },
  READY: { category: "success", label: "Ready" },
  FAILED: { category: "failed", label: "Failed" },
  DELETING: { category: "failed", label: "Deleting" },
  READY_TO_OFFBOARD: { category: "unknown", label: "Ready to Offboard" },
};

export const getAccountConfigStatusStylesAndLabel = (status: string): ColorObject & { label?: string } => {
  const category = accountConfigStatusMap[status]?.category;
  const label = accountConfigStatusMap[status]?.label;
  return {
    ...(category ? chipCategoryColors[category] : { ...defaultChipStyles }),
    ...(label ? { label } : {}),
  };
};

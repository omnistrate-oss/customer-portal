import { Category, chipCategoryColors, ColorObject, defaultChipStyles } from "./index";

const versionSetStatusMap: Record<string, { category: Category; label: string }> = {
  Pending: {
    category: "pending",
    label: "Pending",
  },
  Active: { category: "info", label: "Active" },
  Preferred: { category: "success", label: "Default" },
  Deprecated: { category: "failed", label: "Deprecated" },
};

export const getVersionSetStatusStylesAndLabel = (status: string): ColorObject & { label?: string } => {
  const category = versionSetStatusMap[status]?.category;
  const label = versionSetStatusMap[status]?.label;
  return {
    ...(category ? chipCategoryColors[category] : { ...defaultChipStyles }),
    ...(label ? { label } : {}),
  };
};

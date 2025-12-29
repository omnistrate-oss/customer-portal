export type Category = "success" | "inProgress" | "pending" | "info" | "failed" | "unknown";
export type ColorObject = {
  backgroundColor: string;
  color: string;
  borderColor: string;
};

export const defaultChipStyles: ColorObject = {
  backgroundColor: "#F8F9FC",
  color: "#363F72",
  borderColor: "#D5D9EB",
};

export const chipCategoryColors: Record<Category, ColorObject> = {
  success: {
    backgroundColor: "#ECFDF3",
    color: "#067647",
    borderColor: "#ABEFC6",
  },
  inProgress: {
    backgroundColor: "#F0F9FF",
    color: "#026AA2",
    borderColor: "#B9E6FE",
  },
  pending: {
    backgroundColor: "#FFFAEB",
    color: "#B54708",
    borderColor: "#FEDF89",
  },
  info: {
    backgroundColor: "#EEF4FF",
    color: "#3538CD",
    borderColor: "#C7D7FE",
  },
  failed: {
    backgroundColor: "#FEF3F2",
    color: "#B42318",
    borderColor: "#FECDCA",
  },
  unknown: {
    backgroundColor: "#F8F9FC",
    color: "#363F72",
    borderColor: "#D5D9EB",
  },
};

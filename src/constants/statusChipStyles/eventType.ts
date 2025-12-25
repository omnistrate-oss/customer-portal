import { EventType } from "src/types/event";

import { ColorObject } from "./index";

const stylesMap: Record<EventType, ColorObject & { label: string }> = {
  Customer: {
    color: "#5925DC",
    backgroundColor: "#F4F3FF",
    borderColor: "#D9D6FE",
    label: "Customer",
  },
  Infra: {
    color: "#C11574",
    backgroundColor: "#FDF2FA",
    borderColor: "#FCCEEE",
    label: "Infra",
  },
  Maintenance: {
    color: "#026AA2",
    backgroundColor: "#F0F9FF",
    borderColor: "#B9E6FE",
    label: "Maintenance",
  },
};

export function getEventTypeStylesAndLabel(eventType: EventType): ColorObject & { label: string } {
  let styles = stylesMap[eventType];

  if (!styles) {
    styles = { ...stylesMap["Infra"], label: eventType };
  }

  return styles;
}

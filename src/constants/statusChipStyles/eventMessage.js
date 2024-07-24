import { chipCategoryColors, defaultChipStyles } from "./index";

const eventMessageMap = {
  "Instance capacity added": { category: "success" },
  "Instance deployed": { category: "success" },
  "Instance deployment completed": { category: "success" },
  "Instance is healthy": { category: "success" },
  "Instance modified": { category: "success" },
  "Instance restarted": { category: "success" },
  "Instance started": { category: "success" },
  "Instance updated": { category: "success" },
  "Instance stopped": { category: "terminated" },
  "Adding capacity to instance": { category: "inProgress" },
  "Checking instance health": { category: "inProgress" },
  "Instance deletion started": { category: "inProgress" },
  "Instance deployment started": { category: "inProgress" },
  "Instance failover started": { category: "inProgress" },
  "Instance modification started": { category: "inProgress" },
  "Instance update started": { category: "inProgress" },
  "Removing capacity from instance": { category: "inProgress" },
  "Starting instance": { category: "inProgress" },
  "Stopping instance": { category: "inProgress" },
  "instance action failed": { category: "failed" },
  "Instance capacity removed": { category: "terminated" },
  "Instance deleted": { category: "terminated" },
  "Failing over instance": { category: "inProgress" },
  "Instance deployment failed": { category: "failed" },
  "Instance failed over": { category: "success" },
  "Restarting instance": { category: "inProgress" },
  "Restarting Node X": { category: "inProgress" },
  "Restart Node X complete": { category: "success" },
};

export const getEventMessageStylesAndlabel = (status) => {
  let category;

  if (/^Restarting Node \d$/.test(status)) {
    category = "inProgress";
  } else if (/^Restart Node \d complete$/.test(status)) {
    category = "success";
  } else {
    category = eventMessageMap[status]?.category;
  }

  return {
    ...(category ? chipCategoryColors[category] : { ...defaultChipStyles }),
    label: status,
  };
};

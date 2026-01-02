import AddIcon from "@mui/icons-material/Add";

import UpgradeIcon from "src/components/Icons/Upgrade/UpgradeIcon";
import DeleteIcon from "components/Icons/Delete/Delete";
import EditIcon from "components/Icons/Edit/Edit";
import GenerateTokenIcon from "components/Icons/GenerateToken/GenerateTokenIcon";
import PlayIcon from "components/Icons/Play/Play";
import RebootIcon from "components/Icons/Reboot/Reboot";
import RestoreIcon from "components/Icons/RestoreInstance/RestoreInstanceIcon";
import StopIcon from "components/Icons/Stop/Stop";

export const icons = {
  Stop: StopIcon,
  Start: PlayIcon,
  Delete: DeleteIcon,
  Modify: EditIcon,
  Create: AddIcon,
  Reboot: RebootIcon,
  Restore: RestoreIcon,
  Upgrade: UpgradeIcon,
  "Generate Token": GenerateTokenIcon,
};

export const loadStatusMap = {
  POD_IDLE: "Low",
  POD_NORMAL: "Medium",
  POD_OVERLOAD: "High",

  LOAD_IDLE: "Low",
  LOAD_NORMAL: "Medium",
  LOAD_OVERLOADED: "High",

  STOPPED: "N/A",
  UNKNOWN: "Unknown",
  "N/A": "N/A",
};

export const loadStatusLabel = {
  Low: "Idle",
  Medium: "Normal",
  High: "High",
};

export const customTagsInitializer = { key: "", value: "" };

export const requestParamsEmptyFields = [
  "cloud_provider",
  "region",
  "custom_network_id",
  "custom_availability_zone",
  "subscriptionId",
  "cloud_provider_native_network_id",
  "custom_dns_configuration",
];

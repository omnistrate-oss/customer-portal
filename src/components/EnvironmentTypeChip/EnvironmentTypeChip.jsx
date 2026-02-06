import { ENVIRONMENT_TYPE_LABEL } from "src/constants/environmentTypes";
import useEnvironmentType from "src/hooks/useEnvironmentType";

import { Stack } from "@mui/system";
import { Text } from "../Typography/Typography";
import StatusChip from "../StatusChip/StatusChip";

function EnvironmentTypeChip() {
  const environmentType = useEnvironmentType();
  const environmentLabel = ENVIRONMENT_TYPE_LABEL[environmentType];

  return environmentLabel ? (
    <Stack direction="row" alignItems="center" gap="6px">
      <Text size="medium" weight="semibold" color="#414651">
        {environmentLabel} - Customer Portal
      </Text>
      <StatusChip category="pending" label="Internal Use Only" />
    </Stack>
  ) : (
    ""
  );
}

export default EnvironmentTypeChip;

// function getEnvironmentChipStyles(envType) {
//   const stylesMap = {
//     DEV: {
//       fontColor: "#0086C9",
//       bgColor: "#E0F2FE",
//     },
//     PROD: {
//       fontColor: "#32D583",
//       bgColor: "#D1FADF",
//     },
//     QA: {
//       fontColor: "#B692F6",
//       bgColor: "#F4EBFF",
//     },
//     STAGING: {
//       fontColor: "#FF692E",
//       bgColor: "#FFE6D5",
//     },
//     CANARY: {
//       fontColor: "#DC6803",
//       bgColor: "#FEF0C7",
//     },
//     PRIVATE: {
//       fontColor: "#DD2590",
//       bgColor: "#FDF2FA",
//     },
//   };

//   const defaultStyles = {
//     fontColor: "#0086C9",
//     bgColor: "#E0F2FE",
//   };

//   let styles = stylesMap[envType];

//   if (!styles) {
//     styles = defaultStyles;
//   }

//   return styles;
// }

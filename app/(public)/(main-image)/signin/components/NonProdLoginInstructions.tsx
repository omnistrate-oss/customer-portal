import { FC, ReactNode } from "react";
import { ArrowForward } from "@mui/icons-material";
import { Box, Stack } from "@mui/material";

import InfoFilledIcon from "src/components/Icons/InfoFilled/InfoFilled";
import { Text } from "src/components/Typography/Typography";

const InsructionListItem: FC<{ listItemContent: ReactNode }> = ({ listItemContent }) => {
  return (
    <Stack direction="row" gap="8px" alignItems="flex-start" marginTop="8px">
      <ArrowForward style={{ flexShrink: 0 }} />
      <Text size="small" weight="regular" color="#535862">
        {listItemContent}{" "}
      </Text>
    </Stack>
  );
};

const instructionsList = [
  <>
    Use your existing Omnistrate username/password to access your non-production customer portal. Sign-ups are
    restricted to your domain for security.{" "}
  </>,
  <>You can also configure your Identity provider to authenticate against the customer portal.</>,
  <>Note that Omnistrate Single Sign-On is not currently supported.</>,
  <>Don’t have an Omnistrate username/password? Refer to this documentation.</>,
];

function NonProdLoginInstructions() {
  return (
    <Box border="1px solid #E9EAEB" bgcolor="#FAFAFA" borderRadius="8px" p="20px">
      <Stack direction="row" gap="8px" alignItems="center">
        <InfoFilledIcon style={{ alignSelf: "start" }} />
        <Text size="large" weight="semibold" color="#181D27">
          How to sign in:
        </Text>
      </Stack>
      <Stack marginTop="8px">
        {instructionsList.map((instruction, index) => (
          <InsructionListItem key={index} listItemContent={instruction} />
        ))}
      </Stack>
    </Box>
  );
}

export default NonProdLoginInstructions;

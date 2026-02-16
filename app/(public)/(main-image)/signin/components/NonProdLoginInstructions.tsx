import { FC, ReactNode } from "react";
import Link from "next/link";
import { ArrowForward } from "@mui/icons-material";
import { Box, Stack } from "@mui/material";

import InfoFilledIcon from "src/components/Icons/InfoFilled/InfoFilled";
import { Text } from "src/components/Typography/Typography";
import { IdentityProvider } from "src/types/identityProvider";
import { omnistratePortalUrl } from "src/utils/constants";

const InstructionListItem: FC<{ listItemContent: ReactNode }> = ({ listItemContent }) => {
  return (
    <Stack direction="row" gap="8px" alignItems="flex-start" marginTop="8px">
      <ArrowForward style={{ flexShrink: 0 }} />
      <Text size="small" weight="regular" color="#535862">
        {listItemContent}{" "}
      </Text>
    </Stack>
  );
};

const NonProdLoginInstructions: FC<{ identityProviders: IdentityProvider[] }> = ({ identityProviders }) => {
  const instructionsList = [
    <>
      Use your existing Omnistrate username/password to access your{" "}
      <Box component="span" fontWeight={600}>
        non-production
      </Box>{" "}
      customer portal. Sign-ups are restricted to your domain for security.{" "}
    </>,
    <>
      Used Google or GitHub to sign into the Omnistrate Portal? This Customer Portal requires a password.{" "}
      <Link
        href={`${omnistratePortalUrl}/settings?view=Password`}
        style={{ fontWeight: 600, textDecoration: "underline" }}
        target="_blank"
      >
        Set your password
      </Link>{" "}
      first and then sign in with your email/password.
    </>,
  ];

  if (identityProviders.length === 0) {
    instructionsList.push(
      <>You can also configure your Identity provider to authenticate against the customer portal.</>
    );
  }

  instructionsList.push(<>Note that Omnistrate Single Sign-On is not currently supported.</>);

  return (
    <Box border="1px solid #E9EAEB" bgcolor="#FAFAFA" borderRadius="8px" p="20px">
      <Stack direction="row" gap="8px" alignItems="center">
        <InfoFilledIcon style={{ alignSelf: "flex-start" }} />
        <Text size="large" weight="semibold" color="#181D27">
          How to sign in:
        </Text>
      </Stack>
      <Stack marginTop="8px">
        {instructionsList.map((instruction, index) => (
          <InstructionListItem key={index} listItemContent={instruction} />
        ))}
      </Stack>
    </Box>
  );
};

export default NonProdLoginInstructions;

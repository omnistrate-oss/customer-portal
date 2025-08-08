import { FC } from "react";
import Image from "next/image";
import { Box, Typography } from "@mui/material";

import Button from "src/components/Button/Button";
import { Text } from "src/components/Typography/Typography";
import { getInstancesRoute } from "src/utils/routes";

import NoServicesImage from "public/assets/images/marketplace/no-service-offerings.svg";

type NoServiceFoundUIProps = {
  text: string;
  showMessage?: boolean;
};

const NoServiceFoundUI: FC<NoServiceFoundUIProps> = ({ text, showMessage }) => {
  return (
    <Box
      textAlign="center"
      flex="1"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{ transform: "translateY(-50px)" }}
    >
      <Typography
        fontWeight="800"
        fontSize="36px"
        lineHeight="44px"
        letterSpacing="-0.02em"
        textAlign="center"
        color="#171717"
      >
        {text}
      </Typography>

      {showMessage && (
        <>
          <Text
            size="medium"
            weight="regular"
            color="#535862"
            sx={{ marginTop: "8px", textAlign: "center", maxWidth: "700px" }}
          >
            Something went wrong while loading this page. We&apos;ll take you back to the previous page and reload
            everything. If the problem persists please contact support.
          </Text>

          <Button
            variant="contained"
            onClick={async () => {
              window.location.href = getInstancesRoute();
            }}
            sx={{ marginY: "20px" }}
          >
            Reload
          </Button>
        </>
      )}

      <Image src={NoServicesImage} alt="No Products" width={582} height={400} />
    </Box>
  );
};

export default NoServiceFoundUI;

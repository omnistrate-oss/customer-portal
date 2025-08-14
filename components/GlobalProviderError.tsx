"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Box, styled } from "@mui/material";
import { Stack } from "@mui/system";

import { getInstancesRoute } from "src/utils/routes";
import Button from "components/Button/Button";

import errorImage from "public/assets/images/error.png";

const ErrorImage = styled(Image)({
  width: "100%",
  maxWidth: "620px",
  height: "auto",
});

const Title = styled("h2")({
  fontSize: "36px",
  lineHeight: "44px",
  fontWeight: 700,
  marginTop: 36,
  textAlign: "center",
});

const Description = styled("p")({
  margin: 0,
  fontSize: "20px",
  lineHeight: "30px",
  color: "#475467",
  marginTop: 24,
  maxWidth: 600,
  textAlign: "center",
});

const GlobalProviderError = () => {
  const pathname = usePathname();

  const isOnInstancesPage = pathname === "/instances" || pathname?.startsWith("/instances/");

  const handleRetryAction = () => {
    if (isOnInstancesPage) {
      // Force a page reload to ensure everything refreshes
      window.location.reload();
    } else {
      // Navigate to instances page if on other pages
      window.location.href = getInstancesRoute();
    }
  };

  return (
    <>
      <Stack direction="row" justifyContent="center">
        <Box textAlign="center">
          <ErrorImage src={errorImage} alt="error" priority />
          <Title>Something went wrong!</Title>
          <Description>
            Sorry about that! Please return to the home page and try again. <br />
            If the issue continues, please contact support for assistance.
          </Description>
          <Button variant="contained" size="xlarge" sx={{ marginTop: "40px" }} onClick={handleRetryAction}>
            Go to Home Page
          </Button>
        </Box>
      </Stack>
    </>
  );
};

export default GlobalProviderError;

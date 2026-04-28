"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Stack, styled } from "@mui/material";

import { useProviderOrgDetails } from "src/providers/ProviderOrgDetailsProvider";
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

const ErrorPage = () => {
  const pathname = usePathname();
  const { orgSupportEmail, email } = useProviderOrgDetails();

  return (
    <Stack direction="row" justifyContent="center">
      <Box textAlign="center">
        <ErrorImage src={errorImage} alt="error" priority />
        <Title>Something went wrong!</Title>
        <Description>
          Sorry about that! Please return to the home page and try again.
          {orgSupportEmail || email ? ` If the issue persists please reach out at ${orgSupportEmail || email}` : ""}
        </Description>
        {pathname === getInstancesRoute() ? (
          <Button variant="contained" size="xlarge" sx={{ marginTop: "40px" }} onClick={() => window.location.reload()}>
            Reload
          </Button>
        ) : (
          <Link href={getInstancesRoute()}>
            <Button variant="contained" size="xlarge" sx={{ marginTop: "40px" }}>
              Go to Home
            </Button>
          </Link>
        )}
      </Box>
    </Stack>
  );
};

export default ErrorPage;

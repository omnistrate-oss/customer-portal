import styled from "@emotion/styled";
import errorImage from "../public/assets/images/error.png";
import Image from "next/image";
import { Box, Stack } from "@mui/material";
import Link from "next/link";
import { SubmitButton } from "src/components/NonDashboardComponents/FormElements/FormElements";
import { getProviderOrgDetails } from "src/server/api/customer-user";

export const getServerSideProps = async () => {
  const response = await getProviderOrgDetails();

  return {
    props: {
      orgSupportEmail: response.data.orgSupportEmail || response.data.email,
    },
  };
};

function Error(props) {
  const { orgSupportEmail } = props;
  return (
    <Stack direction="row" justifyContent="center">
      <Box textAlign="center">
        <ErrorImage src={errorImage} alt="error" />
        <Title>Something went wrong!</Title>
        <Description>
          Sorry about that! Please return to the home page and try again.{" "}
          {orgSupportEmail
            ? `If the issue persists please reach out at ${orgSupportEmail}`
            : ""}
        </Description>
        <Link href="/product-tiers">
          <SubmitButton sx={{ marginTop: "40px" }}>Go to Home</SubmitButton>
        </Link>
      </Box>
    </Stack>
  );
}

export default Error;

const ErrorImage = styled(Image)(({ theme }) => ({
  width: "100%",
  maxWidth: "620px",
  height: "auto",
}));

const Title = styled("h2")(({ theme }) => ({
  fontSize: "36px",
  lineHeight: "44px",
  fontWeight: 700,
  marginTop: 36,
  textAlign: "center",
}));

const Description = styled("p")(({ theme }) => ({
  margin: 0,
  fontSize: "20px",
  lineHeight: "30px",
  color: "#475467",
  marginTop: 24,
  maxWidth: 600,
  textAlign: "center",
}));

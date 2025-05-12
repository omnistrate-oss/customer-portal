import Link from "next/link";
import { Box, Typography } from "@mui/material";
import { useCookieConsentContext } from "src/context/cookieConsentContext";
import { useProviderOrgDetails } from "src/providers/ProviderOrgDetailsProvider";

const Footer = (props) => {
  const { nonFloatingBottomPosition = false } = props;
  const { setIsConsentModalOpen } = useCookieConsentContext();
  const { orgName } = useProviderOrgDetails();
  return (
    <Box
      position={nonFloatingBottomPosition ? "static" : "absolute"}
      bottom="14px"
      left="0"
      right="0"
      display="flex"
      justifyContent="center"
      gap="10px"
      padding={nonFloatingBottomPosition ? "20px" : "0px"}
    >
      <Typography fontWeight="500" fontSize="14px" lineHeight="22px" color="#A0AEC0">
        © {new Date().getFullYear()} {orgName}{" "}
        <Box component="span" sx={{ marginLeft: "12px" }}>
          All rights reserved.
        </Box>
      </Typography>

      <Link
        href="/terms-of-use"
        style={{
          fontWeight: "500",
          fontSize: "14px",
          lineHeight: "22px",
          color: "#111827",
        }}
      >
        Terms & Conditions
      </Link>
      <Link
        href="/privacy-policy"
        style={{
          fontWeight: "500",
          fontSize: "14px",
          lineHeight: "22px",
          color: "#111827",
        }}
      >
        Privacy Policy
      </Link>
      <Typography
        component="p"
        sx={{
          fontWeight: "500",
          fontSize: "14px",
          lineHeight: "22px",
          color: "#111827",
          cursor: "pointer",
        }}
        onClick={() => {
          setIsConsentModalOpen(true);
        }}
      >
        Cookie Settings
      </Typography>
    </Box>
  );
};
export default Footer;

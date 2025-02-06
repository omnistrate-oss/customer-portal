"use client";

import Link from "next/link";
import { Typography } from "@mui/material";

import { useCookieConsentContext } from "src/context/cookieConsentContext";
import { useProviderOrgDetails } from "src/providers/ProviderOrgDetailsProvider";

const Footer = () => {
  const { setIsConsentModalOpen } = useCookieConsentContext();
  const { orgName } = useProviderOrgDetails();

  return (
    <footer
      className="bg-[#FFFFFF] flex items-center gap-8 px-8 py-3"
      style={{
        borderTop: "1px solid rgba(0, 0, 0, 0.12)",
      }}
    >
      <Link
        href="/terms-of-use"
        target="_blank"
        style={{
          fontWeight: "500",
          fontSize: "14px",
          lineHeight: "22px",
          color: "#6B7280",
        }}
      >
        Terms of Use
      </Link>
      <Link
        href="/privacy-policy"
        target="_blank"
        style={{
          fontWeight: "500",
          fontSize: "14px",
          lineHeight: "22px",
          color: "#6B7280",
        }}
      >
        Privacy Policy
      </Link>
      <p
        style={{
          fontWeight: "500",
          fontSize: "14px",
          lineHeight: "22px",
          color: "#6B7280",
          cursor: "pointer",
        }}
        onClick={() => {
          setIsConsentModalOpen(true);
        }}
      >
        Cookie Settings
      </p>

      <Typography
        fontWeight="500"
        fontSize="14px"
        lineHeight="22px"
        color="#A0AEC0"
        ml="auto"
      >
        © {new Date().getFullYear()} {orgName}
        <span className="ml-4">All rights reserved.</span>
      </Typography>
    </footer>
  );
};

export default Footer;

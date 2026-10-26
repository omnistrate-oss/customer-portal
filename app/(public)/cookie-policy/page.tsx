"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Box, styled } from "@mui/material";
import DOMPurify from "isomorphic-dompurify";

import { styleConfig } from "src/providerConfig";
import { useProviderOrgDetails } from "src/providers/ProviderOrgDetailsProvider";
import getSafeExternalURL from "src/utils/getSafeExternalURL";
import CookiePolicyTable from "components/CookiePolicy/CookiePolicyTable";
import Container from "components/NonDashboardComponents/Container/Container";
import Footer from "components/NonDashboardComponents/Footer";

import { SectionDescription, SectionHeading, Title } from "../terms-of-use/StyledComponents";

const List = styled("ul")(() => ({
  marginTop: "16px",
  padding: "0px",
  listStyleType: "disc",
  marginLeft: "40px",
}));

const ListItem = styled("li")({
  "& + &": {
    marginTop: "16px",
    fontSize: "16px",
    lineHeight: "24px",
  },
});

const ListItemHeading = styled("h3")({
  fontWeight: 700,
  fontSize: "16px",
  lineHeight: "24px",
});

const DefaultCookiePolicy = ({ orgName, orgSupportEmail }) => {
  return (
    <>
      <SectionDescription>
        Last Updated: Jan 03, 2025
        <br />
        <br />
        This Cookie Policy explains how {orgName} (referred to as &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
        uses cookies and similar technologies to recognize you when you visit our websites. This document outlines what
        cookies are, how we use them, and your rights to control them.
      </SectionDescription>
      <SectionHeading>What Are Cookies?</SectionHeading>
      <SectionDescription>
        Cookies are small text files that websites store on your device to uniquely identify your browser or store
        information or settings. They help improve navigation, remember preferences, enable functionality, and analyze
        website performance.
        <br />
        <br />
        Cookies set by the website owner (in this case, {orgName}) are called &quot;first-party cookies&quot;. Cookies
        set by third parties are called &quot;third-party cookies&quot;. These enable third-party features or
        functionalities, such as advertising, analytics, or embedded content, on the website.
      </SectionDescription>
      <SectionHeading>Categories of Cookies and Their Providers</SectionHeading>
      <Box sx={{ marginTop: "30px" }}>
        <CookiePolicyTable orgName={orgName} />
      </Box>
      <SectionHeading>How Can You Manage Cookies?</SectionHeading>
      <SectionDescription>
        You have the right to decide whether to accept or reject cookies. When you visit our websites, you may see a
        cookie notice that explains how we use cookies and provides an option to manage your preferences. You can:
      </SectionDescription>
      <List>
        <ListItem>
          <ListItemHeading>Cookie Settings</ListItemHeading>
          Access and update your cookie preferences at any time by clicking on the &quot;Cookie Settings&quot; link in
          the footer of our website.
        </ListItem>
        <ListItem>
          <ListItemHeading>Adjust Browser Settings</ListItemHeading>
          Most web browsers allow you to control cookies through their settings. You can configure your browser to block
          cookies or alert you when cookies are being set. Note that blocking some cookies may impact website
          functionality.
        </ListItem>
        <ListItem>
          <ListItemHeading>Google Analytics Opt-Out</ListItemHeading>
          To opt out of Google Analytics, you can install the Google Analytics Opt-Out Browser Add-on: Google Opt-Out.
        </ListItem>
      </List>
      <SectionHeading>Updates to This Policy</SectionHeading>
      <SectionDescription>
        We may update this Cookie Policy from time to time to reflect changes in technology or applicable laws. Please
        review this page periodically for the latest information.
      </SectionDescription>

      <SectionHeading>Contact Us</SectionHeading>
      <SectionDescription>
        If you have any questions about our use of cookies, please contact us at{" "}
        <Box component="span" sx={{ fontWeight: 700, textDecoration: "underline" }}>
          <Link href={`mailto:${orgSupportEmail}`} style={{ color: "#2970FF" }}>
            &nbsp;{orgSupportEmail}
          </Link>
        </Box>
        . Thank you for choosing {orgName}!
      </SectionDescription>
    </>
  );
};

const CookiePolicyPage = () => {
  const { orgName, orgSupportEmail, orgCookiePolicy } = useProviderOrgDetails();
  const policyURL = getSafeExternalURL(orgCookiePolicy);

  useEffect(() => {
    if (policyURL) window.location.replace(policyURL);
  }, [policyURL]);

  if (policyURL) return null;

  return (
    <>
      <Container
        maxWidth="858px"
        sx={{
          paddingTop: {
            mobile: "40px",
            desktop: "100px",
          },
          paddingBottom: {
            mobile: "40px",
            desktop: "100px",
          },
        }}
      >
        <Title>Cookie Policy</Title>
        {orgCookiePolicy && orgCookiePolicy !== "<p><br></p>" ? (
          <article className="prose">
            <Box
              // className="ql-editor"
              sx={{
                marginTop: "30px",
                "& a": {
                  color: styleConfig.primaryColor,
                  textDecoration: "underline",
                },

                "& blockquote": {
                  borderLeft: "4px solid #ccc",
                  paddingLeft: "16px !important",
                  paddingY: "5px !important",
                },
              }}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(orgCookiePolicy),
              }}
            />
          </article>
        ) : (
          <DefaultCookiePolicy orgName={orgName} orgSupportEmail={orgSupportEmail} />
        )}
      </Container>
      <Footer nonFloatingBottomPosition />
    </>
  );
};

export default CookiePolicyPage;

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Box } from "@mui/material";
import DOMPurify from "isomorphic-dompurify";

import { styleConfig } from "src/providerConfig";
import { useProviderOrgDetails } from "src/providers/ProviderOrgDetailsProvider";
import getSafeExternalURL from "src/utils/getSafeExternalURL";
import Container from "components/NonDashboardComponents/Container/Container";
import Footer from "components/NonDashboardComponents/Footer";

import privacyPolicyImg from "public/assets/images/privacy-policy.png";

import { SectionDescription, SectionHeading, StyledImage, Title } from "../terms-of-use/StyledComponents";

const DefaultPrivacyPolicy = ({ orgName, orgSupportEmail }) => {
  return (
    <>
      <SectionHeading sx={{ marginTop: "50px" }}>{orgName} Privacy Policy Abstract</SectionHeading>
      <SectionDescription>
        Privacy matters, so we try to keep it simple. The true, legal privacy policy is below, but in an effort to push
        plain-language communication, we wanted to include an abstract. Like most websites and web services, we directly
        and indirectly collect some information about you. We do so in order to communicate with you and to try to make
        our service the best it can be. We respect your privacy and only share your information when the business
        requires it (e.g. payment processing). Your personal information is not a monetization channel for us. We may
        use it to learn and share what we&apos;ve learned about analytics, but all personally identifiable information
        will be stripped from that dataset. Cool? Again, this is just an abstract. The nitty gritty is listed below. If
        you think our abstract is inconsistent with our policy, let us know. We really want to be on the up and up.
      </SectionDescription>
      <SectionHeading>{orgName} Privacy Policy</SectionHeading>
      <SectionDescription>
        Last updated: July 28, 2023 This Privacy Policy explains our practices regarding the information we collect
        through our website and related services (collectively, the &quot;Service&quot;). By submitting information
        through our website or services, you agree to the terms of this Privacy Policy and you expressly consent to the
        processing of your information according to this Privacy Policy. Your Information may be processed by us in the
        country where it was collected as well as other countries (including the United States) where laws regarding
        processing of information may be less stringent than the laws in your country.
      </SectionDescription>
      <SectionHeading>What Information {orgName} Collects</SectionHeading>
      <SectionDescription>
        We collect Personal Data and Anonymous Data from you when you visit our site, when you send us information or
        communications, and/or when you use our Service. &quot;Personal Data&quot; means data that allows someone to
        identify or contact you, including, for example, your name, telephone number, e-mail address, as well as any
        other non-public information about you that is associated with or linked to any of the foregoing data.
        &quot;Anonymous Data&quot; means data that is not associated with or linked to your Personal Data; Anonymous
        Data does not permit the identification of individual persons. When you register for an account, we collect
        certain profile information such as your first and last name and e-mail address. If you send us feedback, send
        us an email or contact us via the Service, we will collect any Personal Data in that feedback, email or contact.
        If you participate in one of our surveys or request a demo, we may collect additional Personal Data from you. We
        may combine Personal Data submitted by you with information obtained from other sources. Like most websites,
        {orgName} collects certain information from you automatically, such as your Internet protocol address, browser
        type, operating system, and access time. We also use cookies and navigational data like Uniform Resource
        Locators (URL) to gather information regarding your use of the Service. A &quot;cookie&quot; is a small data
        file placed on your hard drive when you visit certain websites. You may disable cookies by adjusting the
        preferences settings of your browser. Consult the &quot;Help&quot; feature of your browser for specific
        instructions. If you choose to disable cookies, some areas of our website may not work properly.
      </SectionDescription>
      <SectionHeading>How {orgName} Uses Your Information</SectionHeading>
      <SectionDescription>
        In general, we use your Personal Data to respond to requests from you or to aid us in serving you better. We may
        use your Personal Data, including information tracking your use of our Service, to improve our website and
        Service. We may use your Personal Data to periodically send you newsletters, administrative notices, updates
        regarding the Service and communications promoting the use of our Service. You may &quot;opt-out&quot; of such
        communications as set forth below.
      </SectionDescription>
      <SectionHeading>How {orgName} Shares Your Information</SectionHeading>
      <SectionDescription>
        {orgName} respects the privacy of our users and their data. We will not share the data you send us with any
        third-parties except in accordance with this Privacy Policy. We may use your Personal Data to create Anonymous
        Data by removing any information personally identifiable to you. We reserve the right to share Anonymous Data in
        our discretion. If another company acquires us or our assets, that company will possess the Personal Data
        collected by it and us and will assume the rights and obligations described in this Privacy Policy. You
        expressly consent to our transfer of Personal Data to such acquirer in connection with such acquisition.
        Regardless of any choices you make regarding your Personal Data (as described below), we may disclose Personal
        Data if it believes in good faith that such disclosure is necessary to (a) comply with relevant laws or to
        respond to subpoenas or warrants served on us; or (b) protect or defend the rights or property of us or users of
        the Service.
      </SectionDescription>
      <SectionHeading>Your Options</SectionHeading>
      <SectionDescription>
        When you receive newsletters or promotional communications from us, you may indicate a preference to stop
        receiving further communications from us by following the unsubscribe instructions provided in the e-mail you
        receive. Despite your preferences, we will continue to send you administrative communications, such as notices
        of updates to this Privacy Policy. You may change your Personal Data by editing your profile or by sending us an
        e-mail.
      </SectionDescription>
      <SectionHeading>Third Parties</SectionHeading>
      <SectionDescription>
        We may share your Personal Data with third party service providers, such as payment providers, to provide you
        with the Service. These third party service providers are required not to use your Personal Data other than to
        provide the services requested by us. You expressly consent to the sharing of your Personal Data with our
        contractors and other service providers for the sole purpose of providing the Service to you. Our provision of a
        link to any other website or location is for your convenience and does not signify our endorsement of such other
        website or location or its contents. When you click on such a link, you will leave our site and go to another
        site. During this process, another entity may collect Personal Data or Anonymous Data from you. We have no
        control over, do not review, and cannot be responsible for, these outside websites or their content. Please be
        aware that the terms of this Privacy Policy do not apply to these outside websites or content, or to any
        collection of data after you click on links to such outside websites.
      </SectionDescription>
      <SectionHeading>Security</SectionHeading>
      <SectionDescription>
        {orgName} is committed to protecting the security of your information. We use a variety of industry-standard
        security technologies and procedures to help protect your information from unauthorized access, use, or
        disclosure, including limiting access to the data within {orgName}. Despite these measures, you should know that{" "}
        {orgName} cannot fully eliminate security risks associated with your information and mistakes may happen.
      </SectionDescription>

      <SectionHeading>Changes to this Policy</SectionHeading>
      <SectionDescription>
        If we make any substantial changes in the way we use your Personal Data, we will notify you by sending you an
        e-mail to the last e-mail address you provided to us and/or by prominently posting notice of the changes on our
        website. Any material changes to this Privacy Policy will be effective upon the earlier of thirty (30) calendar
        days following our dispatch of an e-mail notice to you or thirty (30) calendar days following our posting of
        notice of the changes on our website. These changes will be effective immediately for new users of our Service.
        In any event, changes to this Privacy Policy may affect our use of Personal Data that you provided us prior to
        our notification to you of the changes. If you do not wish to permit changes in our use of your Personal Data,
        you must notify us prior to the effective date of the changes that you wish to deactivate your account with us.
        Continued use of our website or Service, following notice of such changes shall indicate your acknowledgement of
        such changes and agreement to be bound by the terms and conditions of such changes.
      </SectionDescription>

      <SectionHeading>Contact Us</SectionHeading>
      <SectionDescription>
        If you have any questions or feedback regarding this Privacy Policy, please let us know. Please contact us at{" "}
        <Box component="span" sx={{ fontWeight: 700, textDecoration: "underline" }}>
          <Link href={`mailto:${orgSupportEmail}`} style={{ color: "#2970FF" }}>
            &nbsp;{orgSupportEmail}
          </Link>
        </Box>
        .
      </SectionDescription>
    </>
  );
};

const PrivacyPolicyPage = () => {
  const { orgName, orgPrivacyPolicy, orgSupportEmail } = useProviderOrgDetails();
  const policyURL = getSafeExternalURL(orgPrivacyPolicy);

  useEffect(() => {
    const pageTitle = orgName ? `Privacy Policy - ${orgName}` : "Privacy Policy";

    document.title = pageTitle;
  }, [orgName]);

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
          minHeight: "calc(100vh - 62px)",
        }}
      >
        <Title>Privacy Policy</Title>
        <StyledImage quality={90} src={privacyPolicyImg} alt="privacy-policy" priority />
        {orgPrivacyPolicy && orgPrivacyPolicy !== "<p><br></p>" ? (
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
                __html: DOMPurify.sanitize(orgPrivacyPolicy),
              }}
            />
          </article>
        ) : (
          <DefaultPrivacyPolicy orgName={orgName} orgSupportEmail={orgSupportEmail} />
        )}
      </Container>
      <Footer nonFloatingBottomPosition />
    </>
  );
};

export default PrivacyPolicyPage;

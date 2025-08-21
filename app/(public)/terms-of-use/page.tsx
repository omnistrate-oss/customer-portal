"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Box } from "@mui/material";
import DOMPurify from "isomorphic-dompurify";

import { styleConfig } from "src/providerConfig";
import { useProviderOrgDetails } from "src/providers/ProviderOrgDetailsProvider";
import Container from "components/NonDashboardComponents/Container/Container";
import Footer from "components/NonDashboardComponents/Footer";

import termsImg from "public/assets/images/terms.png";

import { SectionDescription, SectionHeading, StyledImage, Title } from "./StyledComponents";

const DefaultTermsOfUse = ({ orgName, orgSupportEmail }) => {
  return (
    <>
      <SectionHeading sx={{ marginTop: "91px" }}>General</SectionHeading>
      <SectionDescription>
        This Agreement and any action related thereto will be governed and interpreted by and under the laws of the
        State of California, without giving effect to any conflicts of laws principles that require the application of
        the law of a different state. The United Nations Convention on Contracts for the International Sale of Goods
        shall not apply to this Agreement. You hereby expressly consent to the personal jurisdiction and venue in the
        state and federal courts for the county in which {orgName}&apos;s principal place of business is located for any
        lawsuit filed there against you by {orgName} arising from or related to this Agreement. We and our suppliers
        make no representation that the Services are appropriate or available for use in locations other than the United
        States. If you use the Services from outside the United States, you are solely responsible for compliance with
        all applicable laws, including without limitation export and import regulations of other countries. You may not
        assign, subcontract, delegate, or otherwise transfer these Terms, or your rights and obligations herein, without
        obtaining our prior written consent. We may freely assign these Terms. Any waiver or failure to enforce any
        provision of this Agreement on one occasion will not be deemed a waiver of any other provision or of such
        provision on any other occasion. If any provision of this Agreement is, for any reason, held to be invalid or
        unenforceable, the other provisions of this Agreement will remain enforceable and the invalid or unenforceable
        provision will be deemed modified so that it is valid and enforceable to the maximum extent permitted by law.
        These Terms are the final, complete and exclusive agreement of the parties with respect to the subject matters
        hereof and supersede and merge all prior discussions between the parties with respect to such subject matters.
        No modification of or amendment to these Terms, or any waiver of any rights under these Terms, will be effective
        unless in writing and signed by an authorized signatory of you and an officer of {orgName}.
      </SectionDescription>
      <SectionHeading>Disclaimer of Warranties</SectionHeading>
      <SectionDescription>
        {orgName} IS PROVIDING THE SERVICES ON AN &quot;AS IS&quot; BASIS FOR USE AT YOUR OWN RISK. {orgName} DOES NOT
        WARRANT THAT THE OPERATION OF THE SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE. {orgName} DISCLAIMS ALL
        WARRANTIES, WHETHER EXPRESS, IMPLIED OR STATUTORY, INCLUDING WITHOUT LIMITATION, ANY IMPLIED WARRANTIES OF
        TITLE, NON-INFRINGEMENT OF THIRD PARTY RIGHTS, MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
      </SectionDescription>
      <SectionHeading>Limitation of Liability</SectionHeading>
      <SectionDescription>
        YOU AGREE THAT {orgName} SHALL NOT BE RESPONSIBLE FOR ANY LOSS OR DAMAGE TO YOU, YOUR CUSTOMERS, OR THIRD
        PARTIES CAUSED BY THE USE OF OR INABILITY TO USE THE SERVICES OR FAILURE OF THE SERVICES TO FUNCTION. IN NO
        EVENT WILL {orgName} BE LIABLE FOR ANY SPECIAL, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, OR INDIRECT DAMAGES,
        INCLUDING LOST DATA AND LOST PROFITS, IN CONNECTION WITH THE USE OF THE SERVICES OR OTHER MATERIALS PROVIDED
        ALONG WITH THE SERVICES OR IN CONNECTION WITH ANY OTHER CLAIM ARISING FROM THIS AGREEMENT, EVEN IF {orgName}
        HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. TO THE MAXIMUM EXTENT PERMITTED BY LAW, {orgName}&apos;S
        AGGREGATE CUMULATIVE LIABILITY HEREUNDER SHALL NOT EXCEED FIFTY DOLLARS ($50.00).
      </SectionDescription>
      <SectionHeading>Indemnity</SectionHeading>
      <SectionDescription>
        You will indemnify and hold us, our suppliers and licensors, and our respective subsidiaries, affiliates,
        officers, agents, employees, representatives, and assigns harmless from any costs, damages, expenses, and
        liability caused by your use of the Services, your violation of these Terms, your violation of any applicable
        law, regulation or rule, including, but not limited to, the Health Insurance Portability and Accountability Act
        of 1996, the Children&apos;s Online Privacy Protection Act of 1998, or the Gramm-Leach-Bliley Act of 1999, or
        your violation of any rights of a third party through use of the Services.
      </SectionDescription>
      <SectionHeading>Conditions of Use</SectionHeading>
      <SectionDescription>
        You will not (i) decompile, disassemble, reverse engineer or otherwise attempt to obtain or perceive the source
        code from which any software component of the Services are compiled or interpreted, and you acknowledge that
        nothing in this Agreement will be construed to grant you any right to obtain or use such code; (ii) create any
        derivative product from any of the foregoing; (iii) without our express written permission, introduce software
        or automated agents or scripts to the Services so as to produce multiple accounts, generate automated searches,
        requests and queries, or to strip or mine data from the Services; (iv) perform or publish any performance or
        benchmark tests or analyses relating to the Services or the use thereof; or (v) allow third parties to gain
        access to the Services or to otherwise use the Services in any manner other than as expressly permitted in this
        Agreement. You are responsible for notifying any end user of your products or services that access the Services
        that your products or services will transmit personal data to us through the Services and obtaining such end
        user&apos;s consent to the collection of such personal data by us.
      </SectionDescription>
      <SectionHeading>Your Content</SectionHeading>
      <SectionDescription>
        You are solely responsible for any content and other material that you submit, publish, transmit, or display on,
        through, or with our Services (&quot;Content&quot;). You grant us a non-exclusive, worldwide, royalty-free and
        fully paid license to use the Content, as necessary, for purposes of providing the Services to you and other
        users of the Services. All rights in and to the Content not expressly granted to us in this Agreement are
        reserved by you. You will not use our Services to: (i) upload, post, email, or otherwise transmit any Content
        that contains unlawful, harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene,
        libelous, invasive of another&apos;s privacy, hateful, or racially, ethnically or otherwise objectionable; (ii)
        harm us or third parties in any way; (iii) impersonate any person or entity, or otherwise misrepresent your
        affiliation with any person or entity; (iv) upload, post, email, or otherwise transmit any Content that you do
        not have a right to transmit under any law or under contractual or fiduciary relationships (such as inside
        information, proprietary and confidential information learned or disclosed as part of employment relationships
        or under nondisclosure agreements); (v) upload, post, email or otherwise transmit any Content that contains
        confidential health information governed under the Health Insurance Portability and Accountability Act of 1996
        (HIPAA); (vi) upload, post, email or otherwise transmit any Content that contains identifiable financial
        information (such as Social Security numbers, credit card numbers, bank account numbers, or bank routing
        information); (vii) upload, post, email or otherwise transmit any Content that contains password information for
        any third-party users; (viii) upload, post, email or otherwise transmit any Content that contains personally
        identifiable information for individuals under the age of 13 years old; (x) upload, post, email or otherwise
        transmit any Content that infringes any patent, trademark, trade secret, copyright, or other right of any party;
        (xi) upload, post, email, or otherwise transmit any unsolicited or unauthorized advertising, promotional
        materials, &quot;junk mail&quot;, &quot;spam&quot;, &quot;chain letters&quot;, &quot;pyramid schemes&quot;, or
        any other forms of solicitation; (xii) upload, post, email, or otherwise transmit any Content that contains
        software viruses or any other computer code, files, or programs designed to interrupt, destroy, or limit the
        functionality of any computer software or hardware or telecommunications equipment; (xiii) interfere with or
        disrupt the Services or servers or networks connected to the Services, or disobey any requirements, procedures,
        policies or regulations of networks connected to the Services; (xiv) intentionally or unintentionally violate
        any applicable local, state, national or international law or regulation; (xv) &quot;stalk&quot; or otherwise
        harass another user of the Services. You agree that we may (but has no obligation to), in our sole discretion,
        remove or modify any Content which we deem to violate this section.
      </SectionDescription>
      <SectionHeading>Term and Termination</SectionHeading>
      <SectionDescription>
        These Terms will continue to apply until terminated by either you or
        {orgName} as set forth below (the &quot;Term&quot;). If you want to terminate your agreement with us, you may do
        so by (a) notifying us at any time; and (b) closing your accounts for the Services, where we have made this
        option available to you. Your notice should be sent, in writing, to Company&apos;s address set forth below. We
        may at any time terminate our agreement with you if (a) you have breached any provision of these Terms (or have
        acted in a manner that clearly shows you do not intend to, or are unable to, comply with these Terms); (b) we
        are required to do so by law (for example, where the provision of the Services to you is, or becomes, unlawful);
        (c) the provision of the Services to you by us is, in our opinion, no longer commercially viable; or (d) we have
        elected to discontinue the Services (or any part thereof). Termination of your account includes: (a) removal of
        access to all offerings within the Services; (b) deletion of your password and all related information; and (c)
        barring of further use of the Services. Upon expiration or termination, you shall promptly discontinue use of
        the Services. However, the sections titled IP Ownership, Your Content, Feedback, Disclaimer of Warranties,
        Limitation of Liability, Indemnity, Term and Termination and General of these Terms will survive any termination
        of the Terms.
      </SectionDescription>
      <SectionHeading>IP Ownership</SectionHeading>
      <SectionDescription>
        Subject to the rights granted in this Agreement, {orgName} retains all right, title and interest in and to the
        Services, and you acknowledge that you neither own nor acquire any rights in and to the Services other than the
        limited rights expressly granted under this Agreement.
      </SectionDescription>
      <SectionHeading>Usernames and Passwords</SectionHeading>
      <SectionDescription>
        You are responsible for maintaining the confidentiality of your username and password, and are solely
        responsible for all activities that occur thereunder. You agree (i) not to allow a third party to use your
        account, usernames or passwords at any time; and (ii) to notify
        {orgName} promptly of any actual or suspected unauthorized use of your account, usernames or passwords, or any
        other breach or suspected breach of this Agreement.
      </SectionDescription>
      <SectionHeading>Copyright Policy</SectionHeading>
      <SectionDescription>
        We reserve the right to terminate our agreement with any customer who repeatedly infringes third party copyright
        rights upon prompt notification to us by the copyright owner or the copyright owner&apos;s legal agent. Without
        limiting the foregoing, if you believe that a copyrighted work has been copied and posted via the Services in a
        way that constitutes copyright infringement, you shall provide us with the following information: (a) an
        electronic or physical signature of the person authorized to act on behalf of the owner of the copyrighted work;
        (b) an identification and location in connection with the Service of the copyrighted work that you claim has
        been infringed; (c) a written statement by you that you have a good faith belief that the disputed use is not
        authorized by the owner, its agent, or the law; (d) your name and contact information, such as telephone number
        or email address; and (e) a statement by you that the above information in your notice is accurate and, under
        penalty of perjury, that you are the copyright owner or authorized to act on the copyright owner&apos;s behalf.
        Contact information for our Copyright Agent for notice of claims of copyright infringement is as follows:
        <br />
        <Box component={"span"} sx={{ fontWeight: 700, marginTop: "32px", display: "inline-block" }}>
          {orgName} <br />
          Attn: Copyright Agent <br />
          {orgSupportEmail}
        </Box>
      </SectionDescription>
      <SectionHeading>Changes to these Terms</SectionHeading>
      <SectionDescription>
        If we make any substantial changes to these Terms, we will notify you by sending you an e-mail to the last
        e-mail address you provided to us and/or by prominently posting notice of the changes on our website. Any
        material changes to these Terms will be effective upon the earlier of thirty (30) calendar days following our
        dispatch of an e-mail notice to you or thirty (30) calendar days following our posting of notice of the changes
        on our website. These changes will be effective immediately for new users of our Service. If you do not agree to
        the changes in the Terms, you must notify us prior to the effective date of the changes that you wish to
        deactivate your account with us. Continued use of our website or Service, following notice of such changes shall
        indicate your acknowledgement of such changes and agreement to be bound by the terms and conditions of such
        changes.
      </SectionDescription>
      <SectionHeading>Feedback</SectionHeading>
      <SectionDescription>
        You acknowledge and agree that any comments, ideas and/or reports provided to {orgName} (&quot;Feedback&quot;)
        shall be the property of {orgName} and you hereby irrevocably transfer and assign to
        {orgName} such Feedback, and all associated intellectual property rights, provided however that you shall be
        free to use such Feedback in the ordinary conduct of your business.
      </SectionDescription>
      <SectionHeading>Privacy Policy</SectionHeading>
      <SectionDescription>
        Our collection and use of your information is governed by our Privacy Policy, available{" "}
        <Link href="/privacy-policy" style={{ color: "#2970FF" }}>
          here
        </Link>
        .
      </SectionDescription>
    </>
  );
};

const TermsPage = () => {
  const { orgName, orgSupportEmail, orgTermsOfUse } = useProviderOrgDetails();

  useEffect(() => {
    const pageTitle = orgName ? `Terms and Conditions - ${orgName}` : "Terms and Conditions";

    document.title = pageTitle;
  }, [orgName]);

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
        <Title>Terms and Conditions</Title>
        <StyledImage src={termsImg} alt="privacy-policy" />
        {orgTermsOfUse && orgTermsOfUse !== "<p><br></p>" ? (
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
                __html: DOMPurify.sanitize(orgTermsOfUse),
              }}
            />
          </article>
        ) : (
          <DefaultTermsOfUse orgName={orgName} orgSupportEmail={orgSupportEmail} />
        )}
      </Container>
      <Footer nonFloatingBottomPosition />
    </>
  );
};

export default TermsPage;

import { useState } from "react";
import Link from "next/link";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Stack, styled } from "@mui/material";

import { useCookieConsentContext } from "src/context/cookieConsentContext";
import { useProviderOrgDetails } from "src/providers/ProviderOrgDetailsProvider";

import Button from "../Button/Button";
import FlagWithBackground from "../Icons/Flag/FlagWithBackground";
import { Text } from "../Typography/Typography";

const StyledConsentContainer = styled(Box)<{ maxWidth?: string }>(({ maxWidth }) => ({
  position: "fixed",
  bottom: "0",
  right: "50%",
  transform: "translateX(50%)",
  background: "#364152",
  borderRadius: "12px",
  border: "1px solid #4B5565",
  boxShadow: "0px 2px 2px -1px #0A0D120A, 0px 4px 6px -2px #0A0D1208, 0px 12px 16px -4px #0A0D1214",
  padding: "12px",
  width: "100%",
  maxWidth: maxWidth,
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  zIndex: 1300,
}));

const FlexContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  justifyContent: "space-between",
  alignItems: "center",
  "@media (min-width: 768px)": {
    flexDirection: "row",
  },
}));

function CookieConsentModal() {
  const [isPreferenceModalOpen, setIsPreferenceModalOpen] = useState(false);

  const { consentState, updateConsent, isConsentModalOpen, setIsConsentModalOpen } = useCookieConsentContext();
  const { orgName } = useProviderOrgDetails();

  const closeConsentModal = () => setIsConsentModalOpen(false);

  const closePreferenceModal = () => setIsPreferenceModalOpen(false);

  const handleAllowAll = () => {
    updateConsent(
      consentState?.categories?.map((category) => ({
        ...category,
        enabled: true,
      }))
    );
    closePreferenceModal();
    closeConsentModal();
  };

  const handleAllowNecessary = () => {
    updateConsent(
      consentState?.categories?.map((category) =>
        category.category === "necessary" ? { ...category, enabled: true } : { ...category, enabled: false }
      )
    );
    closePreferenceModal();
    closeConsentModal();
  };

  return (
    <>
      {isConsentModalOpen && !isPreferenceModalOpen && (
        <StyledConsentContainer data-testid="cookie-consent-banner" maxWidth={"1440px"}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center" }}>
            <FlexContainer>
              <Stack direction="row" alignItems="center" gap="16px">
                <FlagWithBackground style={{ flexShrink: 0 }} />
                <Box
                  sx={{
                    color: "#FFFFFF",
                  }}
                >
                  <Text size="medium" weight="semibold" color="#FFFFFF">
                    We care about your privacy
                  </Text>
                  <Text
                    size="small"
                    weight="regular"
                    color="#FFFFFF"
                    sx={{
                      marginTop: "2px",
                      "@media (min-width: 768px)": {
                        fontSize: "16px",
                        lineHeight: "24px",
                      },
                    }}
                  >
                    We use necessary cookies to keep the {orgName} platform secure and reliable. Optional analytics
                    cookies help us improve the platform experience. Accept All enables analytics cookies. Reject All
                    uses only necessary cookies. Learn more in our{" "}
                    <Link
                      href="/cookie-policy"
                      target="_blank"
                      style={{ textDecoration: "underline", cursor: "pointer", fontWeight: 600, color: "#FFFFFF" }}
                    >
                      Cookie Policy
                    </Link>
                    .
                  </Text>
                </Box>
              </Stack>

              <Stack direction="row" gap="16px" alignItems="center" flexShrink={0}>
                <Button
                  size="large"
                  variant="contained"
                  fontColor="#FFFFFF"
                  bgColor="#000000"
                  onClick={handleAllowNecessary}
                >
                  Reject All
                </Button>
                <Button size="large" variant="contained" fontColor="#FFFFFF" bgColor="#000000" onClick={handleAllowAll}>
                  Accept All
                </Button>
              </Stack>
            </FlexContainer>
            <CloseIcon
              htmlColor="#FFFFFF"
              sx={{
                cursor: "pointer",
                flexShrink: 0,
                alignSelf: "flex-start",
                marginTop: "32px",
                "@media (min-width: 768px)": {
                  alignSelf: "center",
                  marginTop: 0,
                },
              }}
              onClick={closeConsentModal}
            />
          </Box>
        </StyledConsentContainer>
      )}
    </>
  );
}

export default CookieConsentModal;

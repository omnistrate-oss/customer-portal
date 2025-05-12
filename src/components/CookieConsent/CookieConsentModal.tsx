import { useState } from "react";
import Link from "next/link";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Stack, styled, Typography } from "@mui/material";

// import CookiePreferenceModal from "./CookiePreferenceModal";
import { useCookieConsentContext } from "src/context/cookieConsentContext";

import Button from "../Button/Button";
import FlagWithBackground from "../Icons/Flag/FlagWithBackground";

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

function CookieConsentModal() {
  const [isPreferenceModalOpen, setIsPreferenceModalOpen] = useState(false);

  const { consentState, updateConsent, isConsentModalOpen, setIsConsentModalOpen } = useCookieConsentContext();

  const closeConsentModal = () => setIsConsentModalOpen(false);

  // const openPreferenceModal = () => setIsPreferenceModalOpen(true);
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

  // const handleSave = (userCategoryPreference) => {
  //   updateConsent(userCategoryPreference);
  //   closePreferenceModal();
  //   closeConsentModal();
  // };

  return (
    <>
      {isConsentModalOpen && !isPreferenceModalOpen && (
        <StyledConsentContainer data-testid="cookie-consent-banner" maxWidth={"1216px"}>
          <Stack direction="row" justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap="16px">
              <FlagWithBackground />
              <Typography
                sx={{
                  fontSize: "16px",
                  fontWeight: 600,
                  lineHeight: "24px",
                  color: "#ffffff",
                }}
              >
                We use third-party cookies in order to personalise your experience.{" "}
                <Box component={"span"} sx={{ fontWeight: 400 }}>
                  Read our{" "}
                  <Link
                    href="/cookie-policy"
                    target="_blank"
                    style={{ textDecoration: "underline", cursor: "pointer" }}
                  >
                    Cookie Policy
                  </Link>
                </Box>
              </Typography>
            </Stack>

            <Stack direction="row" gap="16px" alignItems="center">
              <Button
                size="large"
                variant="contained"
                fontColor="#000000"
                bgColor="#ffffff"
                onClick={handleAllowNecessary}
              >
                Allow necessary
              </Button>
              <Button size="large" variant="contained" fontColor="#ffffff" bgColor="#000000" onClick={handleAllowAll}>
                Allow all
              </Button>
              <CloseIcon htmlColor="#ffffff" sx={{ cursor: "pointer" }} onClick={closeConsentModal} />
            </Stack>
          </Stack>
        </StyledConsentContainer>
      )}

      {/* {isPreferenceModalOpen && (
        <CookiePreferenceModal
          open={isPreferenceModalOpen}
          handleClose={closePreferenceModal}
          handleAllowAll={handleAllowAll}
          handleAllowNecessary={handleAllowNecessary}
          handleSave={handleSave}
        />
      )} */}
    </>
  );
}

export default CookieConsentModal;

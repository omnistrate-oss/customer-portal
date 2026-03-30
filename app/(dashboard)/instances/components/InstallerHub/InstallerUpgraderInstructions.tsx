import CloseIcon from "@mui/icons-material/Close";
import { Box, Dialog, IconButton, Stack, styled } from "@mui/material";

import Button from "src/components/Button/Button";
import InstructionsModalIcon from "src/components/Icons/AccountConfig/InstructionsModalIcon";
import { Text } from "src/components/Typography/Typography";

import InstallerInstructions from "./InstallerInstructions";

interface InstallerUpgraderInstructionsProps {
  open: boolean;
  handleClose: () => void;
  installerInstructions?: string;
}

const StyledContainer = styled(Box)({
  position: "fixed",
  top: "50%",
  right: "50%",
  transform: "translateX(50%) translateY(-50%)",
  background: "white",
  borderRadius: "12px",
  boxShadow: "0px 8px 8px -4px rgba(16, 24, 40, 0.03), 0px 20px 24px -4px rgba(16, 24, 40, 0.08)",
  padding: "24px",
  width: "100%",
  maxWidth: "550px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
});

const Header = styled(Box)({
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

const Content = styled(Box)({
  marginTop: "20px",
  width: "100%",
});

const Footer = styled(Box)({
  marginTop: "24px",
  width: "100%",
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "16px",
});

const InstallerUpgraderInstructions = ({
  open,
  handleClose,
  installerInstructions,
}: InstallerUpgraderInstructionsProps) => {
  
  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth={"md"}>
      <StyledContainer>
        <Header>
          <Stack direction="row" alignItems="center" gap="16px">
            <Box
              sx={{
                border: "1px solid #E4E7EC",
                boxShadow: "0px 1px 2px 0px #1018280D, 0px -2px 0px 0px #1018280D, 0px 0px 0px 1px #1018282E",
                borderRadius: "10px",
                width: "48px",
                height: "48px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <InstructionsModalIcon />
            </Box>
            <Text size="large" weight="semibold">
              Installer/Upgrader Instructions
            </Text>
          </Stack>
          <IconButton onClick={handleClose} sx={{ alignSelf: "flex-start" }}>
            <CloseIcon sx={{ color: "#98A2B3" }} />
          </IconButton>
        </Header>
        <Content>
          <InstallerInstructions installerInstructions={installerInstructions ?? ""} />
        </Content>
        <Footer>
          <Button variant="contained" onClick={handleClose} data-testid="close-instructions-button" fullWidth>
            Close
          </Button>
        </Footer>
      </StyledContainer>
    </Dialog>
  );
};

export default InstallerUpgraderInstructions;

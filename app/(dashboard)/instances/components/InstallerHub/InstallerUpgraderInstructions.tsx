import CloseIcon from "@mui/icons-material/Close";
import { Box, Dialog, IconButton, Stack, styled } from "@mui/material";

import Button from "src/components/Button/Button";
import InstructionsModalIcon from "src/components/Icons/AccountConfig/InstructionsModalIcon";
import LoadingSpinner from "src/components/LoadingSpinner/LoadingSpinner";
import { Text } from "src/components/Typography/Typography";

import useInstancesDescribe from "../../hooks/useInstancesDescribe";

import InstallerInstructions from "./InstallerInstructions";

interface InstanceDetails {
  onPremInstallerDetails?: {
    installerInstructions?: string;
  };
}

interface ResourceParameter {
  resourceId: string;
  urlKey: string;
}

interface InstallerUpgraderInstructionsProps {
  open: boolean;
  handleClose: () => void;
  installerInstructions?: string;
  selectedInstanceOffering?: {
    serviceProviderId: string;
    serviceURLKey: string;
    serviceAPIVersion: string;
    serviceEnvironmentURLKey: string;
    serviceModelURLKey: string;
    productTierURLKey: string;
    resourceParameters: ResourceParameter[];
  } | null;
  selectedInstance?: {
    id: string;
    resourceID?: string;
    subscriptionId?: string;
  } | null;
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
  selectedInstanceOffering,
  selectedInstance,
}: InstallerUpgraderInstructionsProps) => {
  const selectedResource = selectedInstanceOffering?.resourceParameters.find(
    (param) => param.resourceId === selectedInstance?.resourceID
  );

  // Instance describe query — disabled by default, refetched manually during polling.
  const { data: instanceDetails, isFetching } = useInstancesDescribe({
    serviceProviderId: selectedInstanceOffering?.serviceProviderId ?? "",
    serviceKey: selectedInstanceOffering?.serviceURLKey ?? "",
    serviceAPIVersion: selectedInstanceOffering?.serviceAPIVersion ?? "",
    serviceEnvironmentKey: selectedInstanceOffering?.serviceEnvironmentURLKey ?? "",
    serviceModelKey: selectedInstanceOffering?.serviceModelURLKey ?? "",
    productTierKey: selectedInstanceOffering?.productTierURLKey ?? "",
    resourceKey: selectedResource?.urlKey ?? "",
    id: selectedInstance?.id ?? "",
    subscriptionId: selectedInstance?.subscriptionId,
    ignoreGlobalError: true,
    enabled: Boolean(!installerInstructions && selectedInstanceOffering && selectedResource && selectedInstance),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    retry: false,
  });

  const typedInstanceDetails = instanceDetails as InstanceDetails | undefined;
  const installerInstructionsToShow =
    installerInstructions ?? typedInstanceDetails?.onPremInstallerDetails?.installerInstructions;

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
          {isFetching && !installerInstructionsToShow ? (
            <LoadingSpinner />
          ) : (
            <InstallerInstructions installerInstructions={installerInstructionsToShow} />
          )}
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

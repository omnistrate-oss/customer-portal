import CloseIcon from "@mui/icons-material/Close";
import { Box, Dialog, IconButton, Stack, styled } from "@mui/material";

import Button from "src/components/Button/Button";
import CopyToClipboardButton from "src/components/CopyClipboardButton/CopyClipboardButton";
import InstructionsCircledIcon from "src/components/Icons/InstructionsCircled/InstructionsCircled";
import StatusChip from "src/components/StatusChip/StatusChip";
import { Text } from "src/components/Typography/Typography";
import { getResourceInstanceStatusStylesAndLabel } from "src/constants/statusChipStyles/resourceInstanceStatus";

const StyledContainer = styled(Box)({
  position: "fixed",
  top: "0%",
  right: "50%",
  transform: "translateX(50%)",
  background: "white",
  borderRadius: "12px",
  boxShadow: "0px 8px 8px -4px rgba(16, 24, 40, 0.03), 0px 20px 24px -4px rgba(16, 24, 40, 0.08)",
  padding: "24px",
  width: "100%",
  maxWidth: "595px",
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
  paddingInline: "24px",
});

const Footer = styled(Box)({
  marginTop: "24px",
  width: "100%",
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "16px",
});

export type CreateInstanceModalData = {
  isCustomDNS: boolean;
  instanceId: string;
  isFirstInstanceInRegion: boolean;
  lifecycleStatus: string;
};

type CreateInstanceModalProps = {
  open: boolean;
  handleClose: () => void;
  data: CreateInstanceModalData | null;
};

function CreateInstanceModal(props: CreateInstanceModalProps) {
  const { open, handleClose, data } = props;

  const { instanceId, isCustomDNS, isFirstInstanceInRegion, lifecycleStatus = "DEPLOYING" } = data || {};

  const statusStylesAndLabel = getResourceInstanceStatusStylesAndLabel(lifecycleStatus as string);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <StyledContainer>
        <Header>
          <Stack direction="row" alignItems="center" gap="16px">
            <InstructionsCircledIcon />
            <Text size="large" weight="semibold" color="#101828">
              Launching Your Instance
            </Text>
          </Stack>
          <IconButton onClick={handleClose} sx={{ alignSelf: "flex-start" }}>
            <CloseIcon sx={{ color: "#98A2B3" }} />
          </IconButton>
        </Header>
        <Content>
          <Text size="small" weight="semibold" color="#344054">
            {isFirstInstanceInRegion
              ? "Your instance has been created and is currently deploying."
              : " Your instance is being set up and will be ready shortly (usually within a few minutes)."}
          </Text>
          <Box
            display="grid"
            gridTemplateColumns="auto auto 1fr"
            marginTop="20px"
            columnGap={"20px"}
            rowGap={"10px"}
            alignItems={"center"}
          >
            <Text size="small" weight="semibold" color="#344054">
              Instance ID
            </Text>
            <Text size="small" weight="semibold" color="#344054">
              :
            </Text>
            <Stack direction="row" alignItems="center" gap="4px">
              <Text size="small" weight="regular" color="#535862" data-testid="instance-id">
                {instanceId}
              </Text>
              {instanceId && (
                <CopyToClipboardButton
                  text={instanceId}
                  iconProps={{ color: "#067647" }}
                  tooltipText="Copy Instance ID"
                />
              )}
            </Stack>
            <Text size="small" weight="semibold" color="#344054">
              Lifecycle Status
            </Text>
            <Text size="small" weight="semibold" color="#344054">
              :
            </Text>
            <Stack direction="row" alignItems="center" gap="8px">
              <StatusChip status={lifecycleStatus} {...statusStylesAndLabel} showOverflowTitle />
            </Stack>
          </Box>

          {(isCustomDNS || isFirstInstanceInRegion) && (
            <Box mt="20px" borderLeft="2px solid #F79009" paddingLeft="10px" paddingTop="2px" paddingBottom="2px">
              {isFirstInstanceInRegion && (
                <Text size="small" weight="medium" color="#414651">
                  The first deployment in your cloud account may take ~20 minutes. Subsequent deployments in the same
                  region are faster.
                </Text>
              )}
              {isFirstInstanceInRegion && isCustomDNS && <br />}
              {isCustomDNS && (
                <Text size="small" weight="medium" color="#414651">
                  As you have provided a custom DNS, it will need to be configured with your DNS provider. The
                  configuration details will be available after some time. Please revisit the Custom DNS tab later to
                  access the necessary information.
                </Text>
              )}
            </Box>
          )}

          <Text size="small" weight="regular" sx={{ marginTop: "20px" }} color="#535862">
            Track progress in Deployment Instances.
          </Text>
        </Content>
        <Footer sx={{ marginTop: "32px", justifyContent: "center" }}>
          <Button
            size="large"
            variant="contained"
            onClick={handleClose}
            data-testid="close-instructions-button"
            sx={{ padding: "10px 33px !important" }}
          >
            Close
          </Button>
        </Footer>
      </StyledContainer>
    </Dialog>
  );
}

export default CreateInstanceModal;

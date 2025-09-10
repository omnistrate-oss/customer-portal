import Link from "next/link";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Dialog, IconButton, Stack, styled } from "@mui/material";

import { addQuotesToShellCommand } from "src/utils/accountConfig/accountConfig";
import Button from "components/Button/Button";
import LoadingSpinnerSmall from "components/CircularProgress/CircularProgress";
import Form from "components/FormElements/Form/Form";
import TextField from "components/FormElements/TextField/TextField";
import DeleteCircleIcon from "components/Icons/DeleteCircle/DeleteCircleIcon";
import { Text } from "components/Typography/Typography";

import { TextContainerToCopy } from "../CloudProviderAccountOrgIdModal/CloudProviderAccountOrgIdModal";

const StyledForm = styled(Form)({
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

const StyledLink = styled(Link)({
  textDecoration: "underline",
  color: "#7F56D9",
  fontWeight: 700,
  // fontStyle: "italic",
});

const List = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginTop: "8px",
});

const ListItem = styled(Box)({
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  gap: "4px",
});

const ListItemIcon = styled(Box)({
  flexShrink: 0,
});

const ArrowBullet = (props) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.7515 17.6485C8.28287 17.1799 8.28287 16.4201 8.7515 15.9515L12.703 12L8.7515 8.04853C8.28287 7.5799 8.28287 6.8201 8.7515 6.35147C9.22013 5.88284 9.97992 5.88284 10.4486 6.35147L15.2486 11.1515C15.7172 11.6201 15.7172 12.3799 15.2486 12.8485L10.4486 17.6485C9.97992 18.1172 9.22013 18.1172 8.7515 17.6485Z"
      fill="#344054"
    />
  </svg>
);

const DeleteInstructions = ({ accountInstructionDetails }) => {
  return (
    <Box width={"100%"} mb="30px">
      {accountInstructionDetails?.awsAccountID && (
        <Box marginBottom={"20px"}>
          <Text size="small" weight="semibold" color="#374151">
            AWS Account ID
          </Text>
          <TextContainerToCopy text={accountInstructionDetails?.awsAccountID} marginTop="6px" />
        </Box>
      )}

      {accountInstructionDetails?.gcpProjectID && (
        <Stack direction={"row"} alignItems={"flex-start"} gap="12px" marginBottom={"20px"}>
          <Box flex={1} maxWidth={"50%"}>
            <Text size="small" weight="semibold" color="#374151">
              GCP Project ID
            </Text>
            <TextContainerToCopy text={accountInstructionDetails?.gcpProjectID} marginTop="6px" />
          </Box>
          <Box flex={1} maxWidth={"50%"}>
            <Text size="small" weight="semibold" color="#374151">
              GCP Project Number
            </Text>
            <TextContainerToCopy text={accountInstructionDetails?.gcpProjectNumber} marginTop="6px" />
          </Box>
        </Stack>
      )}

      {accountInstructionDetails?.azureSubscriptionID && (
        <Stack direction={"row"} alignItems={"flex-start"} gap="12px" marginBottom={"20px"}>
          <Box flex={1} maxWidth={"50%"}>
            <Text size="small" weight="semibold" color="#374151">
              Azure Subscription ID
            </Text>
            <TextContainerToCopy text={accountInstructionDetails?.azureSubscriptionID} marginTop="6px" />
          </Box>
          <Box flex={1} maxWidth={"50%"}>
            <Text size="small" weight="semibold" color="#374151">
              Azure Tenant ID
            </Text>
            <TextContainerToCopy text={accountInstructionDetails?.azureTenantID} marginTop="6px" />
          </Box>
        </Stack>
      )}

      <Text size="medium" weight="semibold" color="#374151">
        To off-board your account:
      </Text>

      <List>
        <ListItem>
          <ListItemIcon>
            <ArrowBullet />
          </ListItemIcon>

          <Text size="medium" weight="regular" color="#374151">
            To off-board this cloud account, first delete this cloud account instance. If this cloud account is used for
            other Products, delete those cloud account instances too before proceeding to the next step
          </Text>
        </ListItem>
        {accountInstructionDetails?.awsAccountID && (
          <ListItem>
            <ListItemIcon>
              <ArrowBullet />
            </ListItemIcon>

            <Text size="medium" weight="regular" color="#374151">
              {/* <b>Using CloudFormation:</b>  */}
              Follow the provided steps{" "}
              <StyledLink
                target="_blank"
                rel="noopener noreferrer"
                href="https://docs.omnistrate.com/getting-started/account-offboarding/"
              >
                here
              </StyledLink>{" "}
              to complete the off-boarding process and revoke our access.
            </Text>
          </ListItem>
        )}

        {accountInstructionDetails?.gcpProjectID && (
          <ListItem>
            <ListItemIcon>
              <ArrowBullet />
            </ListItemIcon>
            <Box overflow={"hidden"} flex={1}>
              <Text size="medium" weight="regular" color="#374151">
                {/* <b>Using GCP Cloud Shell:</b>  */}
                Open the Google Cloud Shell environment using the following link{" "}
                <StyledLink
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://shell.cloud.google.com/?cloudshell_ephemeral=true&show=terminal"
                >
                  Google Cloud Shell
                </StyledLink>
                . Once the terminal is open, execute the following command to complete the off-boarding process and
                revoke our access.
              </Text>
              {accountInstructionDetails?.gcpOffboardCommand && (
                <TextContainerToCopy
                  text={addQuotesToShellCommand(accountInstructionDetails?.gcpOffboardCommand)}
                  marginTop="12px"
                />
              )}
            </Box>
          </ListItem>
        )}

        {accountInstructionDetails?.azureSubscriptionID && (
          <ListItem>
            <ListItemIcon>
              <ArrowBullet />
            </ListItemIcon>

            <Box overflow={"hidden"} flex={1}>
              <Text size="medium" weight="regular" color="#374151">
                {/* <b>Using GCP Cloud Shell:</b>  */}
                Open the Azure Cloud Shell environment using the following link{" "}
                <StyledLink target="_blank" rel="noopener noreferrer" href="https://portal.azure.com/#cloudshell/">
                  Azure Cloud Shell
                </StyledLink>
                . Once the terminal is open, execute the following command to complete the off-boarding process and
                revoke our access.
              </Text>

              {accountInstructionDetails?.azureOffboardCommand && (
                <TextContainerToCopy
                  text={addQuotesToShellCommand(accountInstructionDetails?.azureOffboardCommand)}
                  marginTop="12px"
                />
              )}
            </Box>
          </ListItem>
        )}
      </List>

      {/* <List sx={{ marginTop: "12px" }}>
        <ListItem>
          <ListItemIcon>
            <ArrowBullet />
          </ListItemIcon>

          <Text size="medium" weight="regular" color="#374151">
            <b>Using Terraform:</b> Execute terraform destroy to revoke our
            access. For more details, refer to the documentation{" "}
            <StyledLink
              target="_blank"
              rel="noopener noreferrer"
              href="https://docs.omnistrate.com/getting-started/account-offboarding/"
            >
              here
            </StyledLink>
            .
          </Text>
        </ListItem>
      </List> */}
    </Box>
  );
};

function DeleteAccountConfigConfirmationDialog(props) {
  const {
    open = false,
    handleClose,
    formData,
    title = "Delete",
    message = "To confirm deletion, please enter <b>deleteme</b>, in the field below:",
    buttonLabel = "Delete",
    buttonColor = "#D92D20",
    isLoading,
    IconComponent = DeleteCircleIcon,
    accountInstructionDetails,
  } = props;

  return (
    <Dialog open={open} onClose={handleClose}>
      <StyledForm onSubmit={formData.handleSubmit}>
        <Header>
          <Stack direction="row" alignItems="center" gap="16px">
            <IconComponent />
            <Text size="large" weight="bold">
              {title}
            </Text>
          </Stack>
          <IconButton onClick={handleClose} sx={{ alignSelf: "flex-start" }}>
            <CloseIcon />
          </IconButton>
        </Header>
        <Content>
          <DeleteInstructions accountInstructionDetails={accountInstructionDetails} />

          <Text size="small" weight="medium" color="#344054" mt="9px" dangerouslySetInnerHTML={{ __html: message }} />
          <TextField
            id="deleteme"
            name="deleteme"
            value={formData.values.deleteme}
            onChange={formData.handleChange}
            onBlur={formData.handleBlur}
            sx={{
              marginTop: "16px",
              [`& .Mui-focused .MuiOutlinedInput-notchedOutline`]: {
                borderColor: "rgba(254, 228, 226, 1) !important",
              },
            }}
          />
        </Content>

        <Footer>
          <Button
            variant="outlined"
            sx={{ height: "40px !important", padding: "10px 14px !important" }}
            disabled={isLoading}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            data-testid="delete-submit-button"
            type="submit"
            variant="contained"
            sx={{ height: "40px !important", padding: "10px 14px !important" }}
            disabled={isLoading}
            bgColor={buttonColor}
          >
            {buttonLabel} {isLoading && <LoadingSpinnerSmall />}
          </Button>
        </Footer>
      </StyledForm>
    </Dialog>
  );
}

export default DeleteAccountConfigConfirmationDialog;

import { Box, Dialog, IconButton, Stack, styled } from "@mui/material";
import Button from "src/components/Button/Button";
import { Text } from "src/components/Typography/Typography";
import CloseIcon from "@mui/icons-material/Close";
import Link from "next/link";
import InstructionsModalIcon from "../Icons/AccountConfig/InstructionsModalIcon";
import CopyToClipboardButton from "../CopyClipboardButton/CopyClipboardButton";
import ArrowBulletIcon from "../Icons/ArrowIcon/ArrowBulletIcon";
import LoadingSpinnerSmall from "../CircularProgress/CircularProgress";
import {
  // ACCOUNT_CREATION_METHODS,
  getAccountConfigStatusBasedHeader,
} from "src/utils/constants/accountConfig";
// import { CLOUD_PROVIDERS } from "src/constants/cloudProviders";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const ArrowBulletSmall = () => <ArrowBulletIcon width={20} height={20} />;

const STATUS_TITLE_MAP = {
  VERIFYING: "Account Configuration Instructions",
  PENDING: "Account Configuration Instructions",
  READY: "Account Configuration Ready",
  FAILED: "Account Config Verification Failed",
};

const StyledContainer = styled(Box)({
  position: "fixed",
  top: "50%",
  right: "50%",
  transform: "translateX(50%) translateY(-50%)",
  background: "white",
  borderRadius: "12px",
  boxShadow:
    "0px 8px 8px -4px rgba(16, 24, 40, 0.03), 0px 20px 24px -4px rgba(16, 24, 40, 0.08)",
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
  fontWeight: 600,
});

const List = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  marginTop: "12px",
});

const ListItem = styled(Box)({
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  gap: "6px",
});

const ListItemIcon = styled(Box)({
  flexShrink: 0,
});

const BodyText = ({ children, ...restProps }) => {
  return (
    <Text size="small" weight="regular" color="#344054" {...restProps}>
      {children}
    </Text>
  );
};

export const TextContainerToCopy = (props) => {
  const { text, marginTop = "20px" } = props;
  return (
    <Box
      sx={{
        marginTop: marginTop,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          padding: "6px 14px",
          borderRadius: "8px",
          border: "1px solid #D0D5DD",
          background: "#F9FAFB",
          boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          size="medium"
          weight="regular"
          color="#667085"
          ellipsis
          title={text}
        >
          {text}
        </Text>

        <CopyToClipboardButton text={text} iconProps={{ color: "#98A2B3" }} />
      </Box>
    </Box>
  );
};

const CreationTimeInstructions = (props) => {
  const {
    accountConfigStatus,
    cloudformationlink,
    cloudFormationGuide,
    cloudFormationTemplateUrl,
    gcpBootstrapShellCommand,
    gcpCloudShellLink,
    shellScriptGuide,
    accountInstructionDetails,
    // orgId,
    accountConfigMethod,
    // terraformlink,
    // terraformGuide,
    fetchClickedInstanceDetails,
    setClickedInstance,
  } = props;

  const queryClient = useQueryClient();
  const [isPolling, setIsPolling] = useState(true);
  const timeoutId = useRef();
  // poll for three times with an interval of 2 seconds
  const pollCountRef = useRef(0);
  const pollInterval = 2000;
  const isMounted = useRef(true);

  const startPolling = async () => {
    if (!isMounted.current) return;

    let resourceInstance;

    try {
      const resourceInstanceResponse = await fetchClickedInstanceDetails();
      resourceInstance = resourceInstanceResponse.data;
    } catch {}

    if (!isMounted.current) return;

    const result_params = resourceInstance?.result_params;
    if (result_params?.cloud_provider_account_config_id) {
      setClickedInstance((prev) => ({
        ...prev,
        result_params: { ...prev?.result_params, ...result_params },
      }));

      queryClient.setQueryData(["instances"], (oldData) => {
        const result_params = {
          // @ts-ignore
          ...oldData?.data?.resourceInstances?.result_params,
          ...resourceInstance.result_params,
        };

        return {
          ...oldData,
          data: {
            resourceInstances: [
              ...(oldData?.data?.resourceInstances || [])?.map((instance) =>
                instance?.id === resourceInstance?.id
                  ? {
                      ...(resourceInstance || {}),
                      result_params: result_params,
                    }
                  : instance
              ),
            ],
          },
        };
      });

      setIsPolling(false);
    } else if (pollCountRef.current < 3) {
      pollCountRef.current += 1;
      timeoutId.current = setTimeout(() => {
        startPolling();
      }, pollInterval);
    } else {
      setIsPolling(false);
    }
  };

  useEffect(() => {
    if (
      // accountConfigMethod === ACCOUNT_CREATION_METHODS.GCP_SCRIPT &&
      !gcpBootstrapShellCommand
    ) {
      startPolling();
    } else {
      setIsPolling(false);
    }

    return () => {};
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, []);

  if (isPolling) {
    return (
      <Stack direction="column" gap="20px" alignItems={"center"}>
        <LoadingSpinnerSmall sx={{ marginLeft: 0 }} />
        <BodyText>Fetching account config setup instructions</BodyText>
      </Stack>
    );
  }

  if (accountConfigStatus === "FAILED") {
    return (
      <BodyText>
        The account configuration could not be saved because of system error.
        Please try again. If the issue continues, reach out to support for
        assistance.{" "}
      </BodyText>
    );
  }

  if (accountInstructionDetails?.awsAccountID) {
    return (
      <>
        <BodyText weight="medium">AWS Account ID</BodyText>
        <TextContainerToCopy
          text={accountInstructionDetails?.awsAccountID}
          marginTop="6px"
        />

        {cloudFormationTemplateUrl ? (
          <>
            <BodyText sx={{ marginTop: "20px" }}>
              Your account details have been saved. To complete the setup please
              create your CloudFormation Stack using the provided template{" "}
              {cloudformationlink}.
            </BodyText>

            <BodyText sx={{ marginTop: "20px" }}>
              If an existing AWSLoadBalancerControllerIAMPolicy policy causes an
              error while creating the CloudFormation stack, set the parameter
              CreateLoadBalancerPolicy to &quot;false&quot;.
            </BodyText>

            <BodyText sx={{ marginTop: "20px" }}>
              For guidance, our instructional video is available{" "}
              {cloudFormationGuide}.
            </BodyText>
          </>
        ) : (
          <BodyText sx={{ marginTop: "20px" }}>
            Your CloudFormation Stack is being configured. Please check back
            shortly for detailed setup instructions.
          </BodyText>
        )}
      </>
    );
  } else if (accountInstructionDetails?.gcpProjectID) {
    if (!accountConfigMethod) {
      return (
        <BodyText>
          Your account details are being configured. Please check back shortly
          for detailed setup instructions.
        </BodyText>
      );
    }

    return (
      <>
        <Stack direction={"row"} alignItems={"flex-start"} gap="12px">
          <Box flex={1} maxWidth={"50%"}>
            <BodyText weight="medium">GCP Project ID</BodyText>
            <TextContainerToCopy
              text={accountInstructionDetails?.gcpProjectID}
              marginTop="6px"
            />
          </Box>
          <Box flex={1} maxWidth={"50%"}>
            <BodyText weight="medium">GCP Project Number</BodyText>
            <TextContainerToCopy
              text={accountInstructionDetails?.gcpProjectNumber}
              marginTop="6px"
            />
          </Box>
        </Stack>

        {/* {accountConfigMethod === ACCOUNT_CREATION_METHODS.GCP_SCRIPT && ( */}
        <>
          {gcpBootstrapShellCommand ? (
            <>
              <BodyText sx={{ marginTop: "20px" }}>
                Please open the Google Cloud Shell environment using the
                following link {gcpCloudShellLink} and execute the below
                command.
              </BodyText>
              <TextContainerToCopy text={gcpBootstrapShellCommand} />
              <BodyText sx={{ marginTop: "20px" }}>
                For guidance, our instructional video is available{" "}
                {shellScriptGuide}.
              </BodyText>
            </>
          ) : (
            <BodyText sx={{ marginTop: "20px" }}>
              Your GCP shell script is being configured. Please check back
              shortly for detailed setup instructions.
            </BodyText>
          )}
        </>
        {/* )} */}
        {/* 
        {accountConfigMethod === ACCOUNT_CREATION_METHODS.TERRAFORM && (
          <>
            {terraformlink ? (
              <>
                <BodyText sx={{ marginTop: "20px" }}>
                  Execute the Terraform scripts available {terraformlink}, by
                  using the Account Config Identity ID below. For guidance our
                  Terraform instructional video is {terraformGuide}.
                </BodyText>
                <TextContainerToCopy text={orgId} />
              </>
            ) : (
              <BodyText sx={{ marginTop: "20px" }}>
                You Terraform details are being configured. Please check back
                shortly for detailed setup instructions.
              </BodyText>
            )}
          </>
        )} */}
      </>
    );
  } else {
    return (
      <BodyText>
        Your account details are being configured. Please check back shortly for
        detailed setup instructions.
      </BodyText>
    );
  }
};

const NonCreationTimeInstructions = (props) => {
  const {
    selectedAccountConfig,
    cloudformationlink,
    cloudFormationGuide,
    cloudFormationTemplateUrl,
    gcpBootstrapShellCommand,
    gcpCloudShellLink,
    shellScriptGuide,
    accountInstructionDetails,
    // orgId,
    // accountConfigMethod,
    // terraformlink,
    // terraformGuide,
  } = props;

  if (
    !accountInstructionDetails?.awsAccountID &&
    !accountInstructionDetails?.gcpProjectID
  ) {
    return (
      <BodyText>
        Your account details are being configured. Please check back shortly for
        detailed setup instructions.
      </BodyText>
    );
  }

  return (
    <>
      <Box width={"100%"}>
        {accountInstructionDetails?.awsAccountID && (
          <>
            <BodyText weight="medium">AWS Account ID</BodyText>
            <TextContainerToCopy
              text={accountInstructionDetails?.awsAccountID}
              marginTop="6px"
            />
          </>
        )}

        {accountInstructionDetails?.gcpProjectID && (
          <Stack direction={"row"} alignItems={"flex-start"} gap="12px">
            <Box flex={1} maxWidth={"50%"}>
              <BodyText weight="medium">GCP Project ID</BodyText>
              <TextContainerToCopy
                text={accountInstructionDetails?.gcpProjectID}
                marginTop="6px"
              />
            </Box>
            <Box flex={1} maxWidth={"50%"}>
              <BodyText weight="medium">GCP Project Number</BodyText>
              <TextContainerToCopy
                text={accountInstructionDetails?.gcpProjectNumber}
                marginTop="6px"
              />
            </Box>
          </Stack>
        )}

        <BodyText sx={{ marginTop: "20px", fontWeight: 600 }}>
          {getAccountConfigStatusBasedHeader(
            selectedAccountConfig?.status
            // accountConfigMethod,
            // accountInstructionDetails?.gcpProjectID
            //   ? CLOUD_PROVIDERS.gcp
            //   : CLOUD_PROVIDERS.aws
          )}
        </BodyText>

        <List>
          {selectedAccountConfig?.status === "FAILED" && (
            <>
              {accountInstructionDetails?.awsAccountID && (
                <>
                  <ListItem>
                    <ListItemIcon>
                      <ArrowBulletSmall />
                    </ListItemIcon>
                    <BodyText>
                      You may delete this failed configuration and retry adding
                      it after carefully verifying the AWS Account ID
                    </BodyText>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <ArrowBulletSmall />
                    </ListItemIcon>
                    <BodyText>
                      If the issue persists, please contact{" "}
                      <StyledLink
                        href="/support"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Omnistrate Support
                      </StyledLink>{" "}
                      for assistance.
                    </BodyText>
                  </ListItem>
                </>
              )}
              {accountInstructionDetails?.gcpProjectID && (
                <>
                  <ListItem>
                    <ListItemIcon>
                      <ArrowBulletSmall />
                    </ListItemIcon>
                    <BodyText>
                      You may delete this failed configuration and retry adding
                      it after carefully verifying the GCP Project ID and
                      Project Number.
                    </BodyText>
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <ArrowBulletSmall />
                    </ListItemIcon>
                    <BodyText>
                      If the issue persists, please contact{" "}
                      <StyledLink
                        href="/support"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Omnistrate Support
                      </StyledLink>{" "}
                      for assistance.
                    </BodyText>
                  </ListItem>
                </>
              )}
            </>
          )}
          {selectedAccountConfig?.status !== "FAILED" && (
            <>
              {accountInstructionDetails?.awsAccountID && (
                <ListItem>
                  <ListItemIcon>
                    <ArrowBulletSmall />
                  </ListItemIcon>
                  {cloudFormationTemplateUrl ? (
                    <>
                      <Box
                        display={"flex"}
                        flexDirection={"column"}
                        gap={"10px"}
                      >
                        <BodyText>
                          Please create your CloudFormation Stack using the
                          provided template {cloudformationlink}.
                        </BodyText>
                        <BodyText>
                          If an existing AWSLoadBalancerControllerIAMPolicy
                          policy causes an error while creating the
                          CloudFormation stack, set the parameter
                          CreateLoadBalancerPolicy to &quot;false&quot;.
                        </BodyText>
                        <BodyText>
                          For guidance, our instructional video is available{" "}
                          {cloudFormationGuide}.
                        </BodyText>
                      </Box>
                    </>
                  ) : (
                    <BodyText>
                      Your CloudFormation Stack is being configured. Please
                      check back shortly for detailed setup instructions.
                    </BodyText>
                  )}
                </ListItem>
              )}
              {accountInstructionDetails?.gcpProjectID && (
                <>
                  {/* {(!accountConfigMethod ||
                accountConfigMethod ===
                  ACCOUNT_CREATION_METHODS.GCP_SCRIPT) && ( */}
                  <ListItem>
                    <ListItemIcon>
                      <ArrowBulletSmall />
                    </ListItemIcon>

                    {gcpBootstrapShellCommand ? (
                      <Box flex={1} overflow={"hidden"}>
                        <BodyText>
                          Please open the Google Cloud Shell environment using
                          the following link {gcpCloudShellLink} and execute the
                          command below.
                        </BodyText>

                        <TextContainerToCopy
                          text={gcpBootstrapShellCommand}
                          marginTop="12px"
                        />
                        <BodyText sx={{ marginTop: "20px" }}>
                          For guidance our instructional video is{" "}
                          {shellScriptGuide}.
                        </BodyText>
                      </Box>
                    ) : (
                      <BodyText flex={1} overflow={"hidden"}>
                        Your Google cloud script is being configured. Please
                        check back shortly for detailed setup instructions.
                      </BodyText>
                    )}
                  </ListItem>
                  {/*  )} */}

                  {/* {(!accountConfigMethod ||
                accountConfigMethod === ACCOUNT_CREATION_METHODS.TERRAFORM) && (
                <ListItem>
                  <ListItemIcon>
                    <ArrowBulletSmall />
                  </ListItemIcon>

                  {terraformlink ? (
                    <Box flex={1} overflow={"hidden"}>
                      <BodyText>
                        <b>Using Terraform:</b> Execute the Terraform scripts
                        available {terraformlink}, by using the Account Config
                        Identity ID below. For guidance our Terraform
                        instructional video is {terraformGuide}.
                      </BodyText>

                      <TextContainerToCopy text={orgId} marginTop="12px" />
                    </Box>
                  ) : (
                    <BodyText flex={1} overflow={"hidden"}>
                      <b>Using Terraform:</b> You Terraform details are being
                      configured. Please check back shortly for detailed setup
                      instructions.
                    </BodyText>
                  )}
                </ListItem>
              )} */}
                </>
              )}
            </>
          )}
        </List>
      </Box>
    </>
  );
};

function CloudProviderAccountOrgIdModal(props) {
  const {
    // orgId,
    open,
    handleClose,
    isAccountCreation,
    cloudFormationTemplateUrl,
    isAccessPage = false,
    accountConfigId,
    selectedAccountConfig,
    gcpBootstrapShellCommand,
    accountInstructionDetails,
    accountConfigMethod,
    // downloadTerraformKitMutation,
    fetchClickedInstanceDetails,
    setClickedInstance,
  } = props;

  const gcpCloudShellLink = (
    <StyledLink
      href="https://shell.cloud.google.com/?cloudshell_ephemeral=true&show=terminal"
      target="_blank"
      rel="noopener noreferrer"
    >
      Google Cloud Shell
    </StyledLink>
  );

  const cloudformationlink = (
    <StyledLink
      href={cloudFormationTemplateUrl ?? ""}
      target="_blank"
      rel="noopener noreferrer"
    >
      here
    </StyledLink>
  );

  // const terraformlink = isAccessPage ? (
  //   <>
  //     <Box
  //       sx={{
  //         cursor: "pointer",
  //         textDecoration: "underline",
  //         color: "#7F56D9",
  //         fontWeight: 600,
  //       }}
  //       component="span"
  //       onClick={() => {
  //         downloadTerraformKitMutation.mutate();
  //       }}
  //     >
  //       here
  //     </Box>
  //     {downloadTerraformKitMutation.isLoading && (
  //       <LoadingSpinnerSmall sx={{ color: "black", ml: "16px" }} size={12} />
  //     )}
  //   </>
  // ) : (
  //   <StyledLink
  //     href="https://github.com/omnistrate-oss/account-setup"
  //     target="_blank"
  //     rel="noopener noreferrer"
  //   >
  //     here
  //   </StyledLink>
  // );

  // links pointing to guides for different methods

  const shellScriptGuide = isAccessPage ? (
    <StyledLink
      href="https://youtu.be/isTGi8tQA2w?si=a12mJXnlA-y2ipVC"
      target="_blank"
      rel="noopener noreferrer"
    >
      here
    </StyledLink>
  ) : (
    <StyledLink
      href="https://youtu.be/isTGi8tQA2w?si=a12mJXnlA-y2ipVC"
      target="_blank"
      rel="noopener noreferrer"
    >
      here
    </StyledLink>
  );

  const cloudFormationGuide = isAccessPage ? (
    <StyledLink
      href="https://youtu.be/c3HNnM8UJBE"
      target="_blank"
      rel="noopener noreferrer"
    >
      {isAccountCreation ? "here" : "guide"}
    </StyledLink>
  ) : (
    <StyledLink
      href="https://youtu.be/Mu-4jppldwk"
      target="_blank"
      rel="noopener noreferrer"
    >
      {isAccountCreation ? "here" : "guide"}
    </StyledLink>
  );

  // const terraformGuide = isAccessPage ? (
  //   <StyledLink
  //     href="https://youtu.be/l6lMEZdMMxs"
  //     target="_blank"
  //     rel="noopener noreferrer"
  //   >
  //     here
  //   </StyledLink>
  // ) : (
  //   <StyledLink
  //     href="https://youtu.be/eKktc4QKgaA"
  //     target="_blank"
  //     rel="noopener noreferrer"
  //   >
  //     here
  //   </StyledLink>
  // );

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth={"tablet"}>
      <StyledContainer>
        <Header>
          <Stack direction="row" alignItems="center" gap="16px">
            <Box
              sx={{
                border: "1px solid #E4E7EC",
                boxShadow:
                  "0px 1px 2px 0px #1018280D, 0px -2px 0px 0px #1018280D,0px 0px 0px 1px #1018282E",
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
              {isAccountCreation ||
              !STATUS_TITLE_MAP[selectedAccountConfig?.status]
                ? "Account Configuration Instructions"
                : STATUS_TITLE_MAP[selectedAccountConfig?.status]}
            </Text>
          </Stack>
          <IconButton onClick={handleClose} sx={{ alignSelf: "flex-start" }}>
            <CloseIcon sx={{ color: "#98A2B3" }} />
          </IconButton>
        </Header>
        <Content>
          {isAccountCreation ? (
            <CreationTimeInstructions
              // orgId={orgId}
              cloudformationlink={cloudformationlink}
              cloudFormationGuide={cloudFormationGuide}
              accountConfigStatus={selectedAccountConfig?.status}
              accountConfigId={accountConfigId}
              cloudFormationTemplateUrl={cloudFormationTemplateUrl}
              gcpBootstrapShellCommand={gcpBootstrapShellCommand}
              gcpCloudShellLink={gcpCloudShellLink}
              shellScriptGuide={shellScriptGuide}
              accountInstructionDetails={accountInstructionDetails}
              accountConfigMethod={accountConfigMethod}
              // terraformlink={terraformlink}
              // terraformGuide={terraformGuide}
              fetchClickedInstanceDetails={fetchClickedInstanceDetails}
              setClickedInstance={setClickedInstance}
            />
          ) : (
            <NonCreationTimeInstructions
              // orgId={orgId}
              selectedAccountConfig={selectedAccountConfig}
              cloudformationlink={cloudformationlink}
              cloudFormationGuide={cloudFormationGuide}
              cloudFormationTemplateUrl={cloudFormationTemplateUrl}
              gcpBootstrapShellCommand={gcpBootstrapShellCommand}
              gcpCloudShellLink={gcpCloudShellLink}
              shellScriptGuide={shellScriptGuide}
              accountInstructionDetails={accountInstructionDetails}
              accountConfigMethod={accountConfigMethod}
              // terraformlink={terraformlink}
              // terraformGuide={terraformGuide}
            />
          )}
        </Content>
        <Footer>
          <Button
            variant="contained"
            onClick={handleClose}
            data-testid="close-button"
            fullWidth
          >
            Close
          </Button>
        </Footer>
      </StyledContainer>
    </Dialog>
  );
}

export default CloudProviderAccountOrgIdModal;

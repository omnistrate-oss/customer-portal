import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Box, Dialog, Stack, Step, StepLabel, Stepper, styled } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";

import { $api } from "src/api/query";
import useEnvironmentType from "src/hooks/useEnvironmentType";
import useSnackbar from "src/hooks/useSnackbar";
import { addQuotesToShellCommand } from "src/utils/accountConfig/accountConfig";
import { roundNumberToTwoDecimals } from "src/utils/formatNumber";
import Button from "components/Button/Button";
import LoadingSpinnerSmall from "components/CircularProgress/CircularProgress";
import TextField from "components/FormElements/TextField/TextField";
import { Text } from "components/Typography/Typography";

import Chip from "../Chip/Chip";
import { TextContainerToCopy } from "../CloudProviderAccountOrgIdModal/CloudProviderAccountOrgIdModal";
import AlertTriangle from "../Icons/AlertTriangle/AlertTriangle";
import DisconnectIcon from "../Icons/Disconnect/Disconnect";
import StepperSuccessIcon from "../Stepper/StepperSuccessIcon";
import StepStepper from "../Stepper/StepStepper";
import {
  CustomStepIcon,
  getStepperProps,
  stateAccountConfigStepper,
  stepsDisconnectRunAccountConfig,
} from "../Stepper/utils";

const StyledForm = styled(Box)({
  position: "fixed",
  top: "0",
  right: "50%",
  transform: "translateX(50%)",
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
  minHeight: "200px",
  display: "flex",
  justifyContent: "center", // Centers horizontally
  alignItems: "center", // Centers vertically
  flexDirection: "column", // Ensures children stack properly
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
  alignItems: "center",
  gap: "4px",
});

const usePolling = (fetchClickedInstanceDetails, setClickedInstance, stepStatusStopPolling) => {
  const environmentType = useEnvironmentType();
  const queryClient = useQueryClient();
  const [isPolling, setIsPolling] = useState(true);
  const timeoutId = useRef(null);
  const pollInterval = 5000; // 5 seconds
  const isMounted = useRef(true);

  const startPolling = async () => {
    if (!isMounted.current) return;

    let resourceInstance;
    try {
      const resourceInstanceResponse = await fetchClickedInstanceDetails();
      resourceInstance = resourceInstanceResponse.data;
    } catch {
      console.log("check error in polling ");
    }

    if (resourceInstance?.status) {
      setClickedInstance((prev) => ({
        ...prev,
        status: resourceInstance.status,
        result_params: {
          ...prev?.result_params,
          ...resourceInstance.result_params,
        },
      }));

      queryClient.setQueryData(
        [
          "get",
          "/2022-09-01-00/resource-instance",
          {
            params: {
              query: {
                environmentType,
              },
            },
          },
        ],
        (oldData) => ({
          resourceInstances: (oldData?.resourceInstances || []).map((inst) =>
            inst?.id === resourceInstance?.id
              ? {
                  ...resourceInstance,
                  status: resourceInstance.status,
                  result_params: resourceInstance.result_params,
                }
              : inst
          ),
        })
      );

      // // Stop polling if the status matches the stop condition
      if (resourceInstance?.status === stepStatusStopPolling) {
        setIsPolling(false);
        return; // Exit the polling
      }
    }

    // Continue polling without a limit
    timeoutId.current = setTimeout(startPolling, pollInterval);
  };

  useEffect(() => {
    startPolling();
    isMounted.current = true;
    // Clean up on unmount
    return () => {
      isMounted.current = false;
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  return { isPolling };
};

const Trigger = ({ formData, serviceProviderName }) => {
  return (
    <Box width={"100%"} display={"flex"} flexDirection={"column"} gap="10px">
      <Stack direction="row" alignItems="center" gap="16px">
        <Box
          sx={{
            border: "1px solid #E4E7EC",
            boxShadow: "0px 1px 2px 0px #1018280D",
            boxshadow: "0px -2px 0px 0px #1018280D inset",
            boxShadow: "0px 0px 0px 1px #1018282E inset",
            padding: "12px",
            borderRadius: "10px",
            bgcolor: "#FFFFFF",
          }}
        >
          <DisconnectIcon />
        </Box>
        <Text size="large" weight="semibold" color="#101828">
          {"Disconnect Cloud Account"}
        </Text>
      </Stack>
      <List>
        <ListItem>
          <Text size="small" weight="regular" color="#414651">
            {`Disconnecting your cloud account will disconnect all associated
            instances from the ${serviceProviderName} Control Plane`}
          </Text>
        </ListItem>
      </List>
      <Box>
        <Text
          size="small"
          weight="semibold"
          color="#344054"
          dangerouslySetInnerHTML={{
            __html: "To confirm, please enter disconnect in the field below:",
          }}
        />
        <TextField
          id="disconnect"
          name="disconnect"
          value={formData.values.disconnect}
          onChange={formData.handleChange}
          onBlur={formData.handleBlur}
          sx={{
            marginTop: "16px",
            [`& .Mui-focused .MuiOutlinedInput-notchedOutline`]: {
              borderColor: "rgba(254, 228, 226, 1) !important",
            },
          }}
        />
      </Box>
    </Box>
  );
};

const Check = ({
  activeStepRun,
  setActiveStepRun,
  instance,
  fetchClickedInstanceDetails,
  setClickedInstance,
  serviceProviderName,
}) => {
  useEffect(() => {
    setActiveStepRun(0);
    // Handle instance status updates separately
    if (instance?.status === "DETACHING" || instance?.status === "PENDING_DETACHING") {
      setActiveStepRun(0);
    } else if (instance?.status === "DISCONNECTING") {
      setActiveStepRun(1);
    }
  }, [activeStepRun, setActiveStepRun, instance?.status]);
  usePolling(fetchClickedInstanceDetails, setClickedInstance, "DISCONNECTED");

  return (
    <Box width={"100%"} display={"flex"} flexDirection={"column"} gap="10px">
      {instance?.status === "DISCONNECTED" ? (
        <Box
          sx={{
            padding: "12px",
            background: "white",
            border: "1px solid #E9EAEB",
            boxShadow: "0px 1px 2px 0px #0A0D120D",
            borderRadius: "12px",
          }}
        >
          {" "}
          <Stack direction="row" justifyContent={"center"} alignItems="center" gap="16px">
            <StepperSuccessIcon />
            <Text size="large" weight="semibold" color="#101828">
              {"Verification complete"}
            </Text>
          </Stack>
        </Box>
      ) : (
        <>
          <Stepper activeStep={activeStepRun} orientation="vertical">
            {stepsDisconnectRunAccountConfig.map((step, index) => (
              <Step key={index}>
                <StepLabel
                  StepIconComponent={CustomStepIcon}
                  sx={{
                    "& .MuiStepLabel-label": {
                      cursor: "default !important",
                    },
                  }}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStepRun === 1 && (
            <Box
              sx={{
                padding: "12px",
                background: "white",
                border: "1px solid #D9E0E8",
                boxShadow: "0px 1px 2px 0px #0A0D120D",
                borderRadius: "12px",
              }}
            >
              {instance?.result_params?.aws_account_id ? (
                <Text size="small" weight="semibold" color="#414651">
                  Run{" "}
                  <StyledLink
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`${instance?.result_params?.disconnect_cloudformation_url}`}
                  >
                    this
                  </StyledLink>
                   CloudFormation template to revoke all {`${serviceProviderName}`} permissions from your account.
                </Text>
              ) : instance?.result_params?.azure_subscription_id ? (
                <Box>
                  <Text size="medium" weight="regular" color="#374151">
                    {/* <b>Using Azure Cloud Shell:</b>  */}
                    Please open the Azure Cloud Shell environment using the following link:{" "}
                    <StyledLink target="_blank" rel="noopener noreferrer" href="https://portal.azure.com/#cloudshell/">
                      Azure Cloud Shell
                    </StyledLink>
                    . Once the terminal is open, execute the following command:
                  </Text>
                  {instance?.result_params?.azure_disconnect_shell_script && (
                    <TextContainerToCopy
                      text={addQuotesToShellCommand(instance?.result_params?.azure_disconnect_shell_script)}
                      marginTop="12px"
                    />
                  )}
                </Box>
              ) : (
                <Box>
                  <Text size="medium" weight="regular" color="#374151">
                    {/* <b>Using GCP Cloud Shell:</b>  */}
                    Please open the Google Cloud Shell environment using the following link:
                    <StyledLink
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://shell.cloud.google.com/?cloudshell_ephemeral=true&show=terminal"
                    >
                      Google Cloud Shell
                    </StyledLink>
                    . Once the terminal is open, execute the following command:
                  </Text>
                  {instance?.result_params?.gcp_disconnect_shell_script && (
                    <TextContainerToCopy
                      text={addQuotesToShellCommand(instance?.result_params?.gcp_disconnect_shell_script)}
                      marginTop="12px"
                    />
                  )}
                </Box>
              )}
              <Chip
                label={
                  <Stack direction="row" alignItems="center" gap="6px">
                    <AlertTriangle />
                    <Text size="xsmall" weight="medium" color="#B54708">
                      This is a mandatory step to fully disconnect your cloud account.
                    </Text>
                  </Stack>
                }
                fontColor="#B54708"
                bgColor="#FFFAEB"
                sx={{
                  marginTop: "6px",
                  display: "inline-block",
                  padding: "2px 8px",
                  border: "1px solid #FEDF89",
                }}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

function DisconnectAccountConfigDialog(props) {
  const {
    open = false,
    handleClose,
    buttonColor = "#079455",
    isFetching,
    instance,
    refetchInstances,
    fetchClickedInstanceDetails,
    setClickedInstance,
    serviceId,
    serviceProviderName,
  } = props;
  const snackbar = useSnackbar();
  const [disconnectState, setDisconnectState] = useState(stateAccountConfigStepper.trigger);
  const [activeStepRun, setActiveStepRun] = useState(0);

  useEffect(() => {
    if (
      instance?.status === "DETACHING" ||
      instance?.status === "PENDING_DETACHING" ||
      instance?.status === "DISCONNECTING" ||
      instance?.status === "DISCONNECTED"
    ) {
      setDisconnectState(stateAccountConfigStepper.check);
    }
  }, [disconnectState, setDisconnectState, instance?.status]);

  const accountConfigMutation = $api.useMutation("post", "/2022-09-01-00/resource-instance/account-config/{id}", {
    onSuccess: () => {
      refetchInstances();
      snackbar.showSuccess("Disconnecting cloud account");
      setDisconnectState(stateAccountConfigStepper.check);
      // eslint-disable-next-line no-use-before-define
      formik.resetForm();
    },
  });

  const formik = useFormik({
    initialValues: {
      disconnect: "",
    },
    onSubmit: (values) => {
      if (!instance) return snackbar.showError("No instance selected");

      if (values.disconnect === "disconnect") {
        accountConfigMutation.mutate({
          params: {
            path: {
              id: instance?.id,
            },
          },
          body: {
            disconnect: true,
            serviceId: serviceId,
            subscriptionId: instance?.subscriptionId,
          },
        });
      } else {
        snackbar.showError("Please enter disconnect");
      }
    },
    validateOnChange: false,
  });

  const handleCancel = () => {
    formik.resetForm();
    handleClose();
    setDisconnectState(stateAccountConfigStepper.trigger);
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <StyledForm>
        <Header>
          <StepStepper {...getStepperProps(disconnectState, roundNumberToTwoDecimals(100))} />
        </Header>
        <Content>
          {disconnectState === stateAccountConfigStepper.trigger && (
            <Trigger formData={formik} serviceProviderName={serviceProviderName} />
          )}
          {disconnectState === stateAccountConfigStepper.check && (
            <Check
              activeStepRun={activeStepRun}
              setActiveStepRun={setActiveStepRun}
              instance={instance}
              fetchClickedInstanceDetails={fetchClickedInstanceDetails}
              setClickedInstance={setClickedInstance}
              serviceProviderName={serviceProviderName}
            />
          )}
        </Content>

        <Footer>
          <Button
            variant="outlined"
            sx={{ height: "40px !important", padding: "10px 14px !important" }}
            disabled={isFetching}
            onClick={handleCancel}
          >
            Cancel
          </Button>
          {disconnectState === stateAccountConfigStepper.trigger && (
            <Button
              type="submit"
              variant="contained"
              sx={{
                height: "40px !important",
                padding: "10px 14px !important",
              }}
              disabled={isFetching || accountConfigMutation.isPending}
              bgColor={buttonColor}
              onClick={formik.handleSubmit}
            >
              {"Disconnect"} {isFetching || (accountConfigMutation.isPending && <LoadingSpinnerSmall />)}
            </Button>
          )}
          {disconnectState === stateAccountConfigStepper.check && (
            <Button
              type="submit"
              variant="contained"
              sx={{
                height: "40px !important",
                padding: "10px 14px !important",
              }}
              disabled={isFetching}
              bgColor={buttonColor}
              onClick={handleCancel}
            >
              {"Close"} {isFetching && <LoadingSpinnerSmall />}
            </Button>
          )}
        </Footer>
      </StyledForm>
    </Dialog>
  );
}

export default DisconnectAccountConfigDialog;

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Box, Dialog, Stack, styled } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";

import { $api } from "src/api/query";
import useEnvironmentType from "src/hooks/useEnvironmentType";
import useSnackbar from "src/hooks/useSnackbar";
import { addQuotesToShellCommand } from "src/utils/accountConfig/accountConfig";
import Button from "components/Button/Button";
import LoadingSpinnerSmall from "components/CircularProgress/CircularProgress";
import TextField from "components/FormElements/TextField/TextField";
import { Text } from "components/Typography/Typography";

import sandClock from "public/assets/images/cloud-account/sandclock.gif";

import Chip from "../Chip/Chip";
import { TextContainerToCopy } from "../CloudProviderAccountOrgIdModal/CloudProviderAccountOrgIdModal";
import AlertTriangle from "../Icons/AlertTriangle/AlertTriangle";
import ConnectIcon from "../Icons/Connect/Connect";
import StepperSuccessIcon from "../Stepper/StepperSuccessIcon";
import StepStepper from "../Stepper/StepStepper";
import { getStepperProps, stateAccountConfigStepper } from "../Stepper/utils";

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
          <ConnectIcon />
        </Box>
        <Text size="large" weight="semibold" color="#101828">
          {"Connect Cloud Account"}
        </Text>
      </Stack>
      <List>
        <ListItem>
          <Text size="small" weight="regular" color="#414651">
            {`Connecting your cloud account will allow ${serviceProviderName} to manage and
            automate all associated instances.`}
          </Text>
        </ListItem>
      </List>
      <Box>
        <Text
          size="small"
          weight="semibold"
          color="#344054"
          dangerouslySetInnerHTML={{
            __html: "To confirm, please enter connect in the field below:",
          }}
        />
        <TextField
          id="connect"
          name="connect"
          value={formData.values.connect}
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

const Check = ({ instance, fetchClickedInstanceDetails, setClickedInstance, serviceProviderName }) => {
  usePolling(fetchClickedInstanceDetails, setClickedInstance, "READY");

  return (
    <Box width={"100%"} display={"flex"} flexDirection={"column"} gap="10px">
      {instance?.status === "READY" ? (
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
            <Image src={sandClock} alt="sandwatch" width={26} />
            <Text size="large" weight="semibold" color="#101828">
              {"Verification is in progress..."}
            </Text>
          </Stack>
          <Box display={"flex"} flexDirection={"column"} mt={"24px"}>
            {instance?.result_params?.aws_account_id ? (
              <Text size="small" weight="semibold" color="#414651">
                {" "}
                Run{" "}
                <StyledLink
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`${instance?.result_params?.connect_cloudformation_url}`}
                >
                  this
                </StyledLink>{" "}
                CloudFormation template to grant {`${serviceProviderName}`} the required permissions.
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
                {instance?.result_params?.azure_bootstrap_shell_script && (
                  <TextContainerToCopy
                    text={addQuotesToShellCommand(instance?.result_params?.azure_bootstrap_shell_script)}
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
                {instance?.result_params?.gcp_bootstrap_shell_script && (
                  <TextContainerToCopy
                    text={addQuotesToShellCommand(instance?.result_params?.gcp_bootstrap_shell_script)}
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
                    This is a mandatory step to fully establish the cloud account connection.
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
          <Text size="small" weight="semibold" color="#414651" mt="24px">
            Once the verification is complete, the lifecycle status will change to Ready.
          </Text>
        </Box>
      )}
    </Box>
  );
};

function ConnectAccountConfigDialog(props) {
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
  const [connectState, setConnectState] = useState(stateAccountConfigStepper.trigger);

  useEffect(() => {
    if (instance?.status === "READY" || instance?.status === "ATTACHING" || instance?.status === "CONNECTING") {
      setConnectState(stateAccountConfigStepper.check);
    }
  }, [connectState, setConnectState, instance?.status]);

  const accountConfigMutation = $api.useMutation("post", "/2022-09-01-00/resource-instance/account-config/{id}", {
    onSuccess: () => {
      refetchInstances();
      snackbar.showSuccess("Connecting cloud account");
      setConnectState(stateAccountConfigStepper.check);
      // eslint-disable-next-line no-use-before-define
      formik.resetForm();
    },
  });

  const formik = useFormik({
    initialValues: {
      connect: "",
    },
    onSubmit: (values) => {
      if (!instance) return snackbar.showError("No instance selected");

      if (values.connect === "connect") {
        accountConfigMutation.mutate({
          params: {
            path: {
              id: instance?.id,
            },
          },
          body: {
            setConnection: true,
            serviceId,
            subscriptionId: instance?.subscriptionId,
          },
        });
      } else {
        snackbar.showError("Please enter connect");
      }
    },
    validateOnChange: false,
  });

  const handleCancel = () => {
    formik.resetForm();
    handleClose();
    setConnectState(stateAccountConfigStepper.trigger);
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <StyledForm>
        <Header>
          <StepStepper {...getStepperProps(connectState)} />
        </Header>
        <Content>
          {connectState === stateAccountConfigStepper.trigger && (
            <Trigger formData={formik} serviceProviderName={serviceProviderName} />
          )}

          {connectState === stateAccountConfigStepper.check && (
            <Check
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
          {connectState === stateAccountConfigStepper.trigger && (
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
              {"Connect"} {isFetching || (accountConfigMutation.isPending && <LoadingSpinnerSmall />)}
            </Button>
          )}
          {connectState === stateAccountConfigStepper.check && (
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

export default ConnectAccountConfigDialog;

import { FC, useEffect, useRef, useState } from "react";
import { Box, Stack, SxProps, Theme } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";

import {
  addCustomDNSToResourceInstance,
  getResourceInstanceDetails,
  removeCustomDNSFromResourceInstance,
} from "src/api/resourceInstance";
import Button from "src/components/Button/Button";
import Card from "src/components/Card/Card";
import LoadingSpinnerSmall from "src/components/CircularProgress/CircularProgress";
import CustomStatusChips from "src/components/CustomStatusChips/CustomStatusChips";
import FieldContainer from "src/components/FormElementsv2/FieldContainer/FieldContainer";
import FieldError from "src/components/FormElementsv2/FieldError/FieldError";
import TextField from "src/components/FormElementsv2/TextField/TextField";
import IconButtonSquare from "src/components/IconButtonSquare/IconButtonSquare";
import AlertTrianglePITR from "src/components/Icons/AlertTrianglePITR/AlertTrianglePITR";
import CircleCheckWithBorderIcon from "src/components/Icons/CircleCheck/CircleCheckWithBorderIcon";
import DeleteIcon from "src/components/Icons/Delete/Delete";
import EditIcon from "src/components/Icons/Edit/Edit";
import PlayIcon from "src/components/Icons/Play/Play";
import PublicResourceIcon from "src/components/Icons/PublicResource/PublicResource";
import TextConfirmationDialog from "src/components/TextConfirmationDialog/TextConfirmationDialog";
import { Text } from "src/components/Typography/Typography";
import { colors } from "src/themeConfig";

import { AddCustomDNSToResourceInstancePayload } from "./ConnectivityCustomDNS";
import CustomDNSDetails from "./CustomDNSDetails";

type EndpointProps = {
  resourceName: string;
  containerStyles?: SxProps<Theme>;
  resourceKey: string;
  resourceId: string;
  resourceHasCompute: boolean;
  customDNSData?: {
    enabled: boolean;
    dnsName?: string;
    status?: string;
    cnameTarget?: string;
    aRecordTarget?: string;
  };
  accessQueryParams: {
    serviceProviderId: string;
    serviceKey: string;
    serviceAPIVersion: string;
    serviceEnvironmentKey: string;
    serviceModelKey: string;
    productTierKey: string;
    subscriptionId: string;
    resourceInstanceId: string;
  };

  refetchInstance: () => void;
};

const CustomDNS: FC<EndpointProps> = (props) => {
  const {
    resourceName,
    customDNSData = { enabled: false },
    accessQueryParams,
    resourceKey,
    resourceId,
    refetchInstance,
    resourceHasCompute,
  } = props;

  const [showDeleteConfirmationDialog, setShowDeleteConfirmationDialog] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [isTextfieldDisabled, setIsTextFieldDisabled] = useState(false);
  const textfieldRef = useRef<HTMLInputElement>(null);
  const timeoutID = useRef<any>(null);
  const pollCount = useRef(0);

  const { dnsName } = customDNSData;
  let isCustomDNSSetup = false;
  if (dnsName) {
    isCustomDNSSetup = true;
  }

  const addCustomDNSMutation = useMutation({
    mutationFn: (payload: AddCustomDNSToResourceInstancePayload) => {
      return addCustomDNSToResourceInstance(
        accessQueryParams.serviceProviderId,
        accessQueryParams.serviceKey,
        accessQueryParams.serviceAPIVersion,
        accessQueryParams.serviceEnvironmentKey,
        accessQueryParams.serviceModelKey,
        accessQueryParams.productTierKey,
        resourceKey,
        accessQueryParams.resourceInstanceId,
        accessQueryParams.subscriptionId,
        payload
      );
    },
    onSuccess: () => {
      refetchInstance();
      setIsTextFieldDisabled(true);
    },
  });

  const removeCustomDNSMutation = useMutation({
    mutationFn: () => {
      return removeCustomDNSFromResourceInstance(
        accessQueryParams.serviceProviderId,
        accessQueryParams.serviceKey,
        accessQueryParams.serviceAPIVersion,
        accessQueryParams.serviceEnvironmentKey,
        accessQueryParams.serviceModelKey,
        accessQueryParams.productTierKey,
        resourceKey,
        accessQueryParams.resourceInstanceId,
        accessQueryParams.subscriptionId
      );
    },
    onSuccess: () => {
      pollInstanceQueryToVerifyDNSRemoval();
      setShowDeleteConfirmationDialog(false);
    },
  });

  function clearExistingTimeout() {
    if (timeoutID.current) {
      clearTimeout(timeoutID.current);
    }
  }

  function pollInstanceQueryToVerifyDNSRemoval() {
    clearExistingTimeout();
    pollCount.current = 0;
    verifyDNSRemoval();

    function verifyDNSRemoval() {
      if (pollCount.current < 5) {
        pollCount.current++;
        const id = setTimeout(() => {
          getResourceInstanceDetails(
            accessQueryParams.serviceProviderId,
            accessQueryParams.serviceKey,
            accessQueryParams.serviceAPIVersion,
            accessQueryParams.serviceEnvironmentKey,
            accessQueryParams.serviceModelKey,
            accessQueryParams.productTierKey,
            resourceKey,
            accessQueryParams.resourceInstanceId,
            accessQueryParams.subscriptionId
          )
            .then((response) => {
              const topologyDetails = response.data?.detailedNetworkTopology?.[resourceId];
              //check for dnsName field in the response, absence means dns removal complete
              // @ts-ignore
              if (!Boolean(topologyDetails?.customDNSEndpoint?.dnsName)) {
                refetchInstance();
              } else {
                verifyDNSRemoval();
              }
            })
            .catch(() => {
              verifyDNSRemoval();
            });
        }, 1500);
        timeoutID.current = id;
      } else {
      }
    }
  }

  useEffect(() => {
    return () => {
      clearExistingTimeout();
    };
  }, []);

  const customDNSFormik = useFormik({
    initialValues: {
      customDNSEndpoint: dnsName ?? "",
    },
    onSubmit: (values) => {
      handleAddDNS({
        customDNS: values.customDNSEndpoint,
      });
    },
    validationSchema: Yup.object().shape({
      customDNSEndpoint: Yup.string()
        //.url("Please enter a valid URL")
        .required("Target Alias is required"),
    }),
    enableReinitialize: true,
  });

  async function handleAddDNS(payload: AddCustomDNSToResourceInstancePayload) {
    addCustomDNSMutation?.mutate(payload);
  }

  useEffect(() => {
    if (customDNSData.enabled === true && customDNSData.dnsName) {
      setIsTextFieldDisabled(true);
    } else if (customDNSData.enabled === true && !customDNSData.dnsName) {
      setIsTextFieldDisabled(false);
    }
  }, [customDNSData]);

  return (
    <>
      {resourceHasCompute && customDNSData?.enabled && (
        <Card
          sx={{
            p: 0,
            borderRadius: "8px",
          }}
        >
          <Box
            display={"flex"}
            gap="16px"
            padding={"20px 24px"}
            alignItems="center"
            borderBottom={"1px solid rgba(213, 215, 218, 1)"}
          >
            <Box>
              <PublicResourceIcon />
            </Box>
            <Text size="medium" weight="bold" color="#6941C6" sx={{ flex: 1, wordBreak: "break-word" }}>
              {resourceName}
            </Text>
          </Box>

          <>
            <Box padding={"24px"} borderBottom={"1px solid rgba(213, 215, 218, 1)"}>
              {(customDNSData?.aRecordTarget || customDNSData?.cnameTarget) && (
                <CustomDNSDetails
                  aRecordTarget={customDNSData?.aRecordTarget}
                  cnameTarget={customDNSData?.cnameTarget}
                  domainName={customDNSData?.dnsName as string}
                  resourceInstanceId={accessQueryParams.resourceInstanceId}
                />
              )}
              <FieldContainer marginTop={0} sx={{ maxWidth: "1000px" }}>
                <Stack direction="row" alignItems="center" gap="24px" marginTop="6px">
                  <TextField
                    //@ts-ignore
                    marginTop="0px"
                    name="customDNSEndpoint"
                    placeholder="Enter Target alias..."
                    onChange={customDNSFormik.handleChange}
                    onBlur={customDNSFormik.handleBlur}
                    value={customDNSFormik.values.customDNSEndpoint}
                    disabled={isTextfieldDisabled}
                    ref={textfieldRef}
                    copyButton={isTextfieldDisabled}
                  />
                  {isTextfieldDisabled ? (
                    <>
                      <IconButtonSquare
                        onClick={() => {
                          setIsTextFieldDisabled(false);
                          //textfieldRef.current.focus();
                        }}
                      >
                        <EditIcon color="#7F56D9" />
                      </IconButtonSquare>
                      <IconButtonSquare
                        sx={{ borderColor: "#FDA29B !important" }}
                        onClick={() => {
                          setDeleteMessage("Are you sure you want to delete this endpoint alias?");
                          setShowDeleteConfirmationDialog(true);
                        }}
                      >
                        <DeleteIcon color={colors.error700} />
                      </IconButtonSquare>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        sx={{
                          borderRadius: "999px",
                        }}
                        onClick={() => {
                          customDNSFormik.submitForm();
                        }}
                        endIcon={<PlayIcon color="rgba(255, 255, 255, 1)" />}
                      >
                        Verify {addCustomDNSMutation.isPending && <LoadingSpinnerSmall />}
                      </Button>
                    </>
                  )}
                </Stack>
                <FieldError>
                  {customDNSFormik.touched.customDNSEndpoint && customDNSFormik.errors.customDNSEndpoint}
                </FieldError>
              </FieldContainer>
              {isCustomDNSSetup && (
                <CustomStatusChips
                  icon={
                    customDNSData?.status === "READY" ? (
                      <CircleCheckWithBorderIcon />
                    ) : (
                      <AlertTrianglePITR height={16} width={16} style={{ alignSelf: "normal", flexShrink: 0 }} />
                    )
                  }
                  containerStyles={
                    customDNSData?.status === "READY"
                      ? {
                          backgroundColor: "rgba(237, 252, 242, 1)",
                          border: "1px solid rgba(170, 240, 196, 1)",
                        }
                      : {
                          backgroundColor: "rgba(254, 251, 232, 1)",
                          border: "1px solid rgba(254, 247, 195, 1)",
                        }
                  }
                >
                  <Text
                    size="xsmall"
                    weight="medium"
                    color={customDNSData?.status === "READY" ? "rgba(8, 116, 67, 1)" : "rgba(220, 104, 3, 1)"}
                  >
                    {customDNSData?.status === "READY" ? "Domain Verified" : "Pending Verification"}
                  </Text>
                </CustomStatusChips>
              )}
            </Box>
          </>

          {isCustomDNSSetup && (
            <TextConfirmationDialog
              open={showDeleteConfirmationDialog}
              handleClose={() => {
                setShowDeleteConfirmationDialog(false);
              }}
              onConfirm={async () => {
                await removeCustomDNSMutation?.mutateAsync();
              }}
              title="Delete Endpoint Alias"
              subtitle={deleteMessage}
              message="To confirm deletion, please enter <b>deleteme</b>, in the field below:"
              isLoading={removeCustomDNSMutation.isPending}
            />
          )}
        </Card>
      )}
    </>
  );
};

export default CustomDNS;

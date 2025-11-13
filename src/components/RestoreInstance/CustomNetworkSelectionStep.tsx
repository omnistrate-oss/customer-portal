import { FC, useEffect, useMemo } from "react";
import Link from "next/link";
import { CircularProgress } from "@mui/material";
import { Box, Stack } from "@mui/system";
import { UseMutationResult } from "@tanstack/react-query";
import { getCustomNetworksMenuItems } from "app/(dashboard)/instances/utils";
import { useFormik } from "formik";

import { CloudProvider } from "src/types/common/enums";
import { CustomNetwork } from "src/types/customNetwork";
import { ServiceOffering } from "src/types/serviceOffering";

import Button from "../Button/Button";
import { DialogContent, DialogFooter, DialogHeader } from "../Dialog/InformationDialogTopCenter";
import FieldContainer from "../FormElementsv2/FieldContainer/FieldContainer";
import FieldError from "../FormElementsv2/FieldError/FieldError";
import FieldTitle from "../FormElementsv2/FieldTitle/FieldTitle";
import MenuItem from "../FormElementsv2/MenuItem/MenuItem";
import Select from "../FormElementsv2/Select/Select";
import AlertTriangle from "../Icons/AlertTriangle/AlertTriangle";
import RestoreInstanceCustomNetwork from "../Icons/RestoreInstance/RestoreInstanceCustomNetwork";
import { SnapshotBase } from "../ResourceInstance/Backup/hooks/useBackup";
import { restoreInstanceWithCustomNetworkValidationSchema } from "../ResourceInstance/Backup/utils";
import { Text } from "../Typography/Typography";

type CustomNetworkSelectionStepProps = {
  handleClose: () => void;
  restoreInstanceMutation: UseMutationResult<void, Error, { customNetwork?: string }, unknown>;
  cloudProvider?: string;
  region: string;
  customNetworks: CustomNetwork[];
  offering: ServiceOffering;
  isFetchingCustomNetworks?: boolean;
  selectedSnapshot: SnapshotBase | null;
  open: boolean;
};

const CustomNetworkSelectionStep: FC<CustomNetworkSelectionStepProps> = ({
  handleClose,
  restoreInstanceMutation,
  cloudProvider,
  region,
  customNetworks,
  offering,
  isFetchingCustomNetworks,
  selectedSnapshot,
  open,
}) => {
  const customNetworkFormik = useFormik({
    initialValues: {
      customNetwork: "",
    },
    enableReinitialize: true,
    validationSchema: restoreInstanceWithCustomNetworkValidationSchema,
    onSubmit: (values) => {
      return restoreInstanceMutation.mutate({ customNetwork: values.customNetwork });
    },
  });

  const customNetworkOptions = useMemo(() => {
    return getCustomNetworksMenuItems(
      customNetworks,
      cloudProvider as unknown as CloudProvider,
      cloudProvider === "aws"
        ? offering.awsRegions || []
        : cloudProvider === "gcp"
          ? offering.gcpRegions || []
          : offering.azureRegions || [],
      region
    );
  }, [customNetworks, cloudProvider, region, offering]);

  useEffect(() => {
    if (!open) {
      customNetworkFormik.resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <DialogHeader>
        <Stack direction={"row"} justifyContent={"flex-start"} alignItems={"flex-start"} gap="16px">
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: "8px",
              border: "1px solid #E9EAEB",
              borderRadius: "10px",
              boxShadow: "0px 1px 2px 0px #0A0D120D, 0px -2px 0px 0px #0A0D120D inset",
            }}
          >
            <RestoreInstanceCustomNetwork width={24} height={24} />
          </Box>
          <Box>
            <Text size="large" weight="semibold" color="#181D27">
              Restore Instance
            </Text>
            <Text size="small" weight="normal" color="#535862">
              Restore this instance from the selected snapshot
            </Text>
          </Box>
        </Stack>
      </DialogHeader>
      <DialogContent>
        {customNetworkOptions?.length > 0 ? (
          <FieldContainer marginTop="0">
            <FieldTitle required sx={{ marginBottom: "6px" }}>
              Select Custom Network
            </FieldTitle>
            <Select
              displayEmpty
              renderValue={() => {
                return (
                  customNetworkOptions?.find((option) => option.value === customNetworkFormik.values.customNetwork)
                    ?.label ?? "Select target network"
                );
              }}
              name="customNetwork"
              options={customNetworkOptions}
              value={customNetworkFormik.values.customNetwork}
              onChange={customNetworkFormik.handleChange}
              onBlur={customNetworkFormik.handleBlur}
              error={customNetworkFormik.touched.customNetwork && Boolean(customNetworkFormik.errors.customNetwork)}
              isLoading={isFetchingCustomNetworks}
              maxWidth="500px"
            >
              {customNetworkOptions?.length > 0 ? (
                customNetworkOptions.map((option) => {
                  return (
                    <MenuItem key={option.value as string} value={option.value as string}>
                      {option.label}
                    </MenuItem>
                  );
                })
              ) : (
                <MenuItem disabled>No custom networks available</MenuItem>
              )}
            </Select>

            <FieldError sx={{ marginTop: "6px", height: "20px" }}>
              {customNetworkFormik.touched.customNetwork && customNetworkFormik.errors.customNetwork}
            </FieldError>
          </FieldContainer>
        ) : (
          <Stack direction="column" alignItems="center" my="8px" gap="4px">
            <Stack direction="row" justifyContent="flex-start" alignItems="center" gap="8px">
              <AlertTriangle width={20} height={20} />
              <Text size="large" color="#181D27">
                No custom network found
              </Text>
            </Stack>

            <Text size="small" weight="regular" color="#535862">
              Custom network missing in target region.{" "}
              <Link
                href="/custom-networks"
                target="_blank"
                style={{ textDecoration: "underline", color: "#079455", fontWeight: "600" }}
              >
                Create
              </Link>{" "}
              one before restoring.
            </Text>
          </Stack>
        )}
      </DialogContent>
      <DialogFooter>
        <Button variant="outlined" disabled={restoreInstanceMutation.isPending} onClick={handleClose}>
          Cancel
        </Button>

        {customNetworkOptions?.length > 0 && (
          <Button
            variant="contained"
            disabled={restoreInstanceMutation.isPending || !selectedSnapshot}
            onClick={customNetworkFormik.handleSubmit}
          >
            Restore Instance{" "}
            {restoreInstanceMutation.isPending && <CircularProgress size={16} sx={{ marginLeft: "8px" }} />}
          </Button>
        )}
      </DialogFooter>
    </>
  );
};

export default CustomNetworkSelectionStep;

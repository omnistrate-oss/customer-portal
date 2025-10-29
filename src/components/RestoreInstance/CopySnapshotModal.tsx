import { FC, useEffect, useMemo } from "react";
import { CircularProgress } from "@mui/material";
import { Box, Stack } from "@mui/system";
import { UseMutationResult } from "@tanstack/react-query";
import { getRegionMenuItems } from "app/(dashboard)/instances/utils";
import { useFormik } from "formik";

import { CloudProvider } from "src/types/common/enums";
import { ServiceOffering } from "src/types/serviceOffering";

import Button from "../Button/Button";
import InformationDialogTopCenter, {
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "../Dialog/InformationDialogTopCenter";
import FieldContainer from "../FormElementsv2/FieldContainer/FieldContainer";
import FieldError from "../FormElementsv2/FieldError/FieldError";
import FieldTitle from "../FormElementsv2/FieldTitle/FieldTitle";
import MenuItem from "../FormElementsv2/MenuItem/MenuItem";
import Select from "../FormElementsv2/Select/Select";
import CopySnapshotIcon from "../Icons/RestoreInstance/CopySnapshotIcon";
import { SnapshotBase } from "../ResourceInstance/Backup/hooks/useBackup";
import { copySnapshotValidationSchema } from "../ResourceInstance/Backup/utils";
import { Text } from "../Typography/Typography";

type CopySnapshotModalProps = {
  open: boolean;
  handleClose: () => void;
  selectedSnapshot: SnapshotBase;
  offering: ServiceOffering;
  cloudProvider?: string;
  copySnapshotMutation: UseMutationResult<void, Error, { targetRegion: string }, unknown>;
};

const CopySnapshotModal: FC<CopySnapshotModalProps> = ({
  open,
  handleClose,
  offering,
  cloudProvider,
  copySnapshotMutation,
  selectedSnapshot,
}) => {
  const copySnapshotFormik = useFormik({
    initialValues: {
      targetRegion: "",
    },
    enableReinitialize: true,
    validationSchema: copySnapshotValidationSchema,
    onSubmit: (values) => {
      return copySnapshotMutation.mutate({ targetRegion: values.targetRegion });
    },
  });

  const regions = useMemo(
    () => getRegionMenuItems(offering, cloudProvider as CloudProvider),
    [offering, cloudProvider]
  );

  useEffect(() => {
    if (!open) {
      copySnapshotFormik.resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <InformationDialogTopCenter open={open} handleClose={handleClose} maxWidth={"550px"}>
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
              boxShadow:
                "box-shadow: 0px 1px 2px 0px #0A0D120D, 0px -2px 0px 0px #0A0D120D inset,0px 0px 0px 1px #0A0D122E inset",
            }}
          >
            <CopySnapshotIcon />
          </Box>
          <Box>
            <Text size="large" weight="semibold" color="#181D27">
              Copy Snapshot
            </Text>
            <Text size="small" weight="normal" color="#535862">
              A snapshot will be created in the selected region. You can restore it to create a new instance there.
            </Text>
          </Box>
        </Stack>
      </DialogHeader>
      <DialogContent>
        <FieldContainer marginTop="0">
          <FieldTitle required sx={{ marginBottom: "6px" }}>
            Target Region
          </FieldTitle>
          <Select
            displayEmpty
            renderValue={() => {
              return (
                regions?.find((option) => option.value === copySnapshotFormik.values.targetRegion)?.label ??
                "Select target region"
              );
            }}
            name="targetRegion"
            options={regions}
            value={copySnapshotFormik.values.targetRegion}
            onChange={copySnapshotFormik.handleChange}
            onBlur={copySnapshotFormik.handleBlur}
            error={copySnapshotFormik.touched.targetRegion && Boolean(copySnapshotFormik.errors.targetRegion)}
          >
            {regions?.length > 0 ? (
              regions.map((option) => {
                return (
                  <MenuItem key={option.value as string} value={option.value as string} disabled={option.disabled}>
                    {option.label}
                  </MenuItem>
                );
              })
            ) : (
              <MenuItem disabled>No regions available</MenuItem>
            )}
          </Select>

          <FieldError sx={{ marginTop: "6px", height: "20px" }}>
            {copySnapshotFormik.touched.targetRegion && copySnapshotFormik.errors.targetRegion}
          </FieldError>
        </FieldContainer>
      </DialogContent>
      <DialogFooter>
        <Button variant="outlined" disabled={copySnapshotMutation.isPending} onClick={handleClose}>
          Cancel
        </Button>

        <Button
          variant="contained"
          disabled={copySnapshotMutation.isPending || !selectedSnapshot}
          onClick={copySnapshotFormik.handleSubmit}
        >
          Create Snapshot
          {copySnapshotMutation.isPending && <CircularProgress size={16} sx={{ marginLeft: "8px" }} />}
        </Button>
      </DialogFooter>
    </InformationDialogTopCenter>
  );
};

export default CopySnapshotModal;

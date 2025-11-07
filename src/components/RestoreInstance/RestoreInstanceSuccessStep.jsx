import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Stack } from "@mui/material";

import SuccessIcon from "src/components/Icons/SuccessIcon/SuccessIcon";

import Button from "../Button/Button";
import CopyButton from "../Button/CopyButton";
import { DialogContent, DialogFooter, DialogHeader } from "../Dialog/InformationDialogTopCenter";
import { Text } from "../Typography/Typography";

function RestoreInstanceSuccessStep({ handleClose, restoredInstanceID, tab = "backups" }) {
  return (
    <>
      <DialogHeader>
        <Stack direction={"row"} justifyContent={"flex-start"} alignItems={"center"} gap="8px">
          <Box sx={{ flexShrink: 0 }}>
            <SuccessIcon />
          </Box>

          <Box>
            <Text size="large" weight="bold">
              Restoration Successful
            </Text>
          </Box>
        </Stack>

        <IconButton onClick={handleClose} sx={{ alignSelf: "" }}>
          <CloseIcon />
        </IconButton>
      </DialogHeader>
      <DialogContent>
        <Box>
          <Text size="medium" weight="semibold" color="344054">
            Your {tab === "snapshots" ? "snapshot" : "backup"} has been successfully restored to a new instance.{" "}
          </Text>

          <Text size="medium" weight="regular" color="344054" mt={0.1}>
            The Instance ID is{"  "}
            <Box
              sx={{
                color: "#7F56D9",
                fontWeight: 700,
                display: "inline",
              }}
            >
              {restoredInstanceID || "-"}
            </Box>
            {restoredInstanceID && <CopyButton text={restoredInstanceID} />}
          </Text>

          <Text size="small" weight="medium" color="#344054" sx={{ marginTop: "24px" }}>
            <strong> Note:- </strong>The new instance is currently being set up and will be available for use in a few
            minutes.
          </Text>
        </Box>
      </DialogContent>
      <DialogFooter>
        <Button variant="contained" onClick={handleClose}>
          Close
        </Button>
      </DialogFooter>
    </>
  );
}

export default RestoreInstanceSuccessStep;

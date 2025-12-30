import { Box } from "@mui/material";

import CopyButton from "src/components/Button/CopyButton";
import { Text } from "src/components/Typography/Typography";

type RestoreSnapshotSuccessContentProps = {
  restoredInstanceId: string;
};

const RestoreSnapshotSuccessContent: React.FC<RestoreSnapshotSuccessContentProps> = ({ restoredInstanceId }) => {
  return (
    <Box>
      <Text size="medium" weight="semibold" color="344054">
        Your snapshot has been successfully restored to a new instance.
      </Text>

      <Text size="medium" weight="regular" color="344054" mt={0.1}>
        The Instance ID is{" "}
        <Box
          component="span"
          sx={{
            color: "#7F56D9",
            fontWeight: 700,
          }}
        >
          {restoredInstanceId || "-"}
        </Box>
        {restoredInstanceId && <CopyButton text={restoredInstanceId} />}
      </Text>

      <Text size="small" weight="medium" color="#344054" sx={{ marginTop: "24px" }}>
        <strong>Note:</strong> The new instance is currently being set up and will be available for use in a few
        minutes.
      </Text>
    </Box>
  );
};

export default RestoreSnapshotSuccessContent;

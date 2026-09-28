import { Box } from "@mui/material";

import CopyButton from "src/components/Button/CopyButton";
import { Text } from "src/components/Typography/Typography";
import { colors } from "src/themeConfig";

type RestoreSnapshotSuccessContentProps = {
  restoredInstanceId: string;
};

const RestoreSnapshotSuccessContent: React.FC<RestoreSnapshotSuccessContentProps> = ({ restoredInstanceId }) => {
  return (
    <Box>
      <Text size="medium" weight="semibold" color={colors.gray700}>
        Your snapshot has been successfully restored to a new instance.
      </Text>

      <Text size="medium" weight="regular" color={colors.gray700} mt={0.1}>
        The Instance ID is{" "}
        <Text component="span" size="medium" weight="bold" color="primary.main">
          {restoredInstanceId || "-"}
        </Text>
        {!!restoredInstanceId && <CopyButton text={restoredInstanceId} />}
      </Text>

      <Text size="small" weight="medium" color={colors.gray700} sx={{ marginTop: "24px" }}>
        <strong>Note:</strong> The new instance is currently being set up and will be available for use in a few
        minutes.
      </Text>
    </Box>
  );
};

export default RestoreSnapshotSuccessContent;

import { FC } from "react";
import { Box, Stack } from "@mui/material";

import Checkbox from "src/components/Checkbox/Checkbox";
import { Text } from "src/components/Typography/Typography";
import { SetState } from "src/types/common/reactGenerics";

type SnapshotBeforeDeletionConfirmationProps = {
  takeFinalSnapshot: boolean;
  setTakeFinalSnapshot: SetState<boolean>;
};

const SnapshotBeforeDeletionConfirmation: FC<SnapshotBeforeDeletionConfirmationProps> = ({
  takeFinalSnapshot,
  setTakeFinalSnapshot,
}) => {
  return (
    <Box borderLeft="2px solid #F79009" padding="2px 8px" paddingRight="16px" marginBottom="20px">
      <Stack direction="row" alignItems="center" gap="2px">
        <Checkbox checked={takeFinalSnapshot} onChange={(e) => setTakeFinalSnapshot(e.target.checked)} />
        <Text size="medium" weight="medium" color="#414651">
          Take final snapshot before deletion
        </Text>
      </Stack>
      <Text size="small" weight="medium" sx={{ marginTop: "8px", color: "#414651" }}>
        This will create a final snapshot of all configured volumes before the instance is deleted.
        <br />
        <br />
        You can use this snapshot to restore the instance later.
      </Text>
    </Box>
  );
};

export default SnapshotBeforeDeletionConfirmation;

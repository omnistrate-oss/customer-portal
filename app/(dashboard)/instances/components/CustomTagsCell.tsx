import { FC, useMemo } from "react";
import { Stack } from "@mui/material";

import StatusChip from "src/components/StatusChip/StatusChip";
import { WhiteTooltip } from "src/components/Tooltip/Tooltip";
import { defaultChipStyles } from "src/constants/statusChipStyles";

type CustomTagsCellProps = {
  customTags?: Array<{ key: string; value: string }>;
  displayNumber?: number;
  sx?: object;
};

const CustomTagsCell: FC<CustomTagsCellProps> = ({ customTags = [], displayNumber = 1, sx = {} }) => {
  //generate display tags until display number
  const displayTags = useMemo(() => customTags.slice(0, displayNumber), [customTags, displayNumber]);

  const remainingTags = useMemo(() => {
    return customTags.slice(displayNumber);
  }, [customTags, displayNumber]);

  if (!customTags || customTags.length === 0) {
    return "-";
  }

  return (
    <WhiteTooltip
      isVisible={remainingTags.length > 0}
      placement="top"
      title={
        <Stack direction="row" alignItems="center" flexWrap="wrap" gap="8px" padding="6px" width="100%">
          {customTags.map((tag, index) => (
            <StatusChip key={index} label={`${tag.key}:${tag.value}`} {...defaultChipStyles} />
          ))}
        </Stack>
      }
    >
      <Stack direction="row" alignItems="center" gap="8px" width="100%" flex={1} sx={sx}>
        {displayTags.map((tag, index) => {
          const label = `${tag.key}:${tag.value}`;
          return <StatusChip key={index} label={label} {...defaultChipStyles} />;
        })}
        {remainingTags.length > 0 ? ` ....` : ""}
      </Stack>
    </WhiteTooltip>
  );
};

export default CustomTagsCell;

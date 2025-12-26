import { useState } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Box, Collapse, Stack } from "@mui/material";

import Button from "../Button/Button";
import DetailsTable from "../DetailsTable/DetailsTable";
import { DisplayText, Text } from "../Typography/Typography";

const Title = ({ title, description }: { title: string; description: string }) => {
  return (
    <Box>
      {/* @ts-ignore */}
      <DisplayText size="xsmall" weight="semibold" color="#181D27">
        {title}
      </DisplayText>
      <Text size="medium" weight="regular" color="#535862" sx={{ mt: "4px" }}>
        {description}
      </Text>
    </Box>
  );
};

type SideDrawerHeaderProps = {
  title: string;
  description: string;
  summaryTableColumns?: any[];
  showHideSummaryButton?: boolean;
};

const SideDrawerHeader: React.FC<SideDrawerHeaderProps> = ({
  title,
  description,
  summaryTableColumns,
  showHideSummaryButton,
}) => {
  const [isSummaryVisible, setIsSummaryVisible] = useState(true);

  return (
    <>
      <Stack direction="row" alignItems="end" justifyContent="space-between" mb="24px" gap="24px">
        <Title title={title} description={description} />

        {showHideSummaryButton && (
          <Button
            endIcon={isSummaryVisible ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            onClick={() => setIsSummaryVisible((previous) => !previous)}
            sx={{ alignSelf: "end", flexShrink: 0 }}
          >
            {isSummaryVisible ? "Hide Summary" : "Show Summary"}
          </Button>
        )}
      </Stack>

      {summaryTableColumns && (
        <Collapse in={isSummaryVisible}>
          <DetailsTable columns={summaryTableColumns} />
        </Collapse>
      )}
    </>
  );
};

export default SideDrawerHeader;

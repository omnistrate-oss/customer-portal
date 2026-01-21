import React, { useState } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Collapse } from "@mui/material";
import { Box, Stack } from "@mui/system";
import clsx from "clsx";

import Button from "src/components/Button/Button";
import { DisplayText, Text } from "src/components/Typography/Typography";

import InstancesIcon from "../../components/Icons/InstancesIcon";

const SummaryHeaderColumn = ({ title }) => {
  return (
    <div
      style={{
        padding: "12px 10px",
        backgroundColor: "#F9FAFB",
      }}
      className="flex items-center justify-center border-b border-[#E4E7EC]"
    >
      <Text size="xsmall" weight="semibold" color="#717680">
        {title}
      </Text>
    </div>
  );
};

const SummaryCell = ({ count }) => {
  return (
    <div style={{ padding: "14px" }} className="flex items-center justify-center">
      <Box>
        <Text size="small" weight="bold" color={count > 0 ? "#D92D20" : "#079455"}>
          {count || 0}
        </Text>
      </Box>
    </div>
  );
};

const InstancesOverview = (props) => {
  const { summary } = props;
  const [isSummaryVisible, setIsSummaryVisible] = useState(true);

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <div className={clsx("flex items-center gap-2")}>
          <InstancesIcon />
          {/* @ts-ignore */}
          <DisplayText size="xsmall" weight="semibold" color="#181D27">
            Deployment Instances
          </DisplayText>
        </div>
        <Button
          endIcon={isSummaryVisible ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          onClick={() => setIsSummaryVisible((prev) => !prev)}
        >
          {isSummaryVisible ? "Hide Summary" : "Show Summary"}
        </Button>
      </Stack>
      <Collapse in={isSummaryVisible}>
        <div
          data-testid="resource-instance-overview"
          className="grid rounded-xl overflow-hidden border border-[#E4E7EC]"
          style={{
            gridTemplateColumns: `repeat(3, minmax(0, 1fr))`,
            marginTop: "10px",
          }}
        >
          {summary?.map(({ title }, index) => {
            return <SummaryHeaderColumn title={title} key={index} />;
          })}
          {summary?.map(({ count }, index) => {
            return <SummaryCell count={count} key={index} />;
          })}
        </div>
      </Collapse>
    </>
  );
};

export default InstancesOverview;

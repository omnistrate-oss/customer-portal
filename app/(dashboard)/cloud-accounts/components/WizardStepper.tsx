"use client";

import { Box, Stack } from "@mui/material";

import StepperDefaultIcon from "src/components/Stepper/StepperDefaultIcon";
import StepperInProgressIcon from "src/components/Stepper/StepperInProgressIcon";
import StepperSuccessIcon from "src/components/Stepper/StepperSuccessIcon";
import { Text } from "src/components/Typography/Typography";

export const WIZARD_STEPS = ["Add New Account", "Grant Access", "Configure VPCs"] as const;

export type WizardStep = 0 | 1 | 2;

type WizardStepperProps = {
  currentStep: WizardStep;
};

const StepIcon = ({ index, currentStep }: { index: number; currentStep: WizardStep }) => {
  if (index < currentStep) return <StepperSuccessIcon />;
  if (index === currentStep) return <StepperInProgressIcon />;
  return <StepperDefaultIcon />;
};

const WizardStepper: React.FC<WizardStepperProps> = ({ currentStep }) => {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "680px",
        mx: "auto",
        position: "relative",
        px: "32px",
      }}
    >
      {/* Connector lines */}
      <Box
        sx={{
          position: "absolute",
          top: "12px",
          left: "calc(32px + 48px)",
          right: "calc(32px + 48px)",
          height: "2px",
          zIndex: 1,
        }}
      >
        {/* First connector (Step 1 → Step 2) */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            width: "50%",
            height: "100%",
            bgcolor: currentStep > 0 ? "#079455" : "#E9EAEB",
          }}
        />
        {/* Second connector (Step 2 → Step 3) */}
        <Box
          sx={{
            position: "absolute",
            right: 0,
            width: "50%",
            height: "100%",
            bgcolor: currentStep > 1 ? "#079455" : "#E9EAEB",
          }}
        />
      </Box>

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        {WIZARD_STEPS.map((label, index) => (
          <Stack key={index} alignItems="center" gap="8px" sx={{ zIndex: 2, minWidth: "80px" }}>
            <Box
              sx={{
                background: "white",
                borderRadius: "50%",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <StepIcon index={index} currentStep={currentStep} />
            </Box>
            <Text
              size="small"
              weight={index === currentStep ? "semibold" : "medium"}
              color={index === currentStep ? "#6941C6" : "#414651"}
              sx={{ textAlign: "center" }}
            >
              {label}
            </Text>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

export default WizardStepper;

export const INSTANCE_STATUS_POLL_INTERVAL_MS = 10_000;
export const MAX_POLL_COUNT = 12;

export const shouldPollInstanceStatus = ({
  open,
  instanceStatus,
  accountConfigStatus,
  isMultiStepDialog,
  hasRequestedDeletion,
  hasRequestedOffboard,
}) => {
  // Offboard is ready when account config is READY_TO_OFFBOARD or instance has FAILED
  const isOffboardReady = accountConfigStatus === "READY_TO_OFFBOARD" || instanceStatus === "FAILED";

  // Poll during step 1: waiting for instance to transition to DELETING / READY_TO_OFFBOARD
  const isWaitingForOffboardTransition =
    (hasRequestedDeletion || instanceStatus === "DELETING") && !isOffboardReady;

  // Poll during step 2: offboard was explicitly requested, track until completion (404)
  const isWaitingForOffboardCompletion = hasRequestedOffboard && isOffboardReady;

  return Boolean(open && isMultiStepDialog && (isWaitingForOffboardTransition || isWaitingForOffboardCompletion));
};

export const shouldResetDeleteMutationOnClose = (isMutationPending) => {
  return Boolean(isMutationPending);
};

export const deriveDeleteDialogState = ({
  isMultiStepDialog,
  isLastInstance,
  accountConfigStatus,
  instanceStatus,
  isDeleteInstanceMutationPending,
  hasRequestedDeletion,
}) => {
  let step = "delete";
  let buttonText = "Delete";
  let isDeletingInstance = false;

  if (isMultiStepDialog) {
    if (instanceStatus === "FAILED" && isLastInstance) {
      step = "offboard";
      buttonText = "Offboard";
    } else if (instanceStatus === "DELETING" && accountConfigStatus === "READY_TO_OFFBOARD") {
      step = "offboard";
      buttonText = "Offboard";
    } else if (
      (instanceStatus === "DELETING" && accountConfigStatus !== "READY_TO_OFFBOARD") ||
      isDeleteInstanceMutationPending ||
      hasRequestedDeletion
    ) {
      step = "delete";
      buttonText = "Deleting";
      isDeletingInstance = true;
    }
  }

  if (instanceStatus === "DELETING" && step === "delete") {
    isDeletingInstance = true;
    buttonText = "Deleting";
  }

  const isLoading = Boolean(isDeleteInstanceMutationPending || isDeletingInstance || hasRequestedDeletion);

  return {
    step,
    buttonText,
    isDeletingInstance,
    isLoading,
  };
};

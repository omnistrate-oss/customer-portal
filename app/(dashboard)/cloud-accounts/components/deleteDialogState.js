export const INSTANCE_STATUS_POLL_INTERVAL_MS = 10_000;
export const MAX_POLL_COUNT = 12;

export const shouldPollInstanceStatus = ({
  open,
  instanceStatus,
  accountConfigStatus,
  isMultiStepDialog,
  hasRequestedDeletion,
}) => {
  // Offboard is ready when account config is READY_TO_OFFBOARD or instance has FAILED
  const isOffboardReady = accountConfigStatus === "READY_TO_OFFBOARD" || instanceStatus === "FAILED";

  // Poll during step 1 only: waiting for instance to transition to DELETING / READY_TO_OFFBOARD.
  // Step 2 (offboard) is handled synchronously — the API call is the final action, no polling needed.
  const isWaitingForOffboardTransition = (hasRequestedDeletion || instanceStatus === "DELETING") && !isOffboardReady;

  return Boolean(open && isMultiStepDialog && isWaitingForOffboardTransition);
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

export const INSTANCE_STATUS_POLL_INTERVAL_MS = 10_000;

export const shouldPollInstanceStatus = ({
  open,
  instanceStatus,
  accountConfigStatus,
  hasRefetchInstanceStatus,
  hasRequestedDeletion,
}) => {
  const isWaitingForOffboardTransition = instanceStatus === "DELETING" && accountConfigStatus !== "READY_TO_OFFBOARD";
  const isWaitingForDeletionToStart =
    hasRequestedDeletion &&
    instanceStatus !== "DELETING" &&
    instanceStatus !== "FAILED" &&
    accountConfigStatus !== "READY_TO_OFFBOARD";

  return Boolean(open && hasRefetchInstanceStatus && (isWaitingForOffboardTransition || isWaitingForDeletionToStart));
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

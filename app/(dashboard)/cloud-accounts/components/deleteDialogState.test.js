import assert from "node:assert/strict";
import test from "node:test";

import { deriveDeleteDialogState, shouldResetDeleteMutationOnClose } from "./deleteDialogState.js";

test("1) close dialog before delete response -> mutation reset and no stale loading for another instance", () => {
  assert.equal(shouldResetDeleteMutationOnClose(true), true);
  assert.equal(shouldResetDeleteMutationOnClose(false), false);

  const accountBState = deriveDeleteDialogState({
    isMultiStepDialog: true,
    isLastInstance: false,
    accountConfigStatus: "READY",
    instanceStatus: "READY",
    isDeleteInstanceMutationPending: false,
    hasRequestedDeletion: false,
  });

  assert.equal(accountBState.isLoading, false);
  assert.equal(accountBState.buttonText, "Delete");
  assert.equal(accountBState.step, "delete");
});

test("2) close and reopen same deleting instance keeps in-progress state", () => {
  const reopenedState = deriveDeleteDialogState({
    isMultiStepDialog: true,
    isLastInstance: true,
    accountConfigStatus: "PENDING",
    instanceStatus: "DELETING",
    isDeleteInstanceMutationPending: false,
    hasRequestedDeletion: false,
  });

  assert.equal(reopenedState.isDeletingInstance, true);
  assert.equal(reopenedState.isLoading, true);
  assert.equal(reopenedState.buttonText, "Deleting");
  assert.equal(reopenedState.step, "delete");
});

test("3) opening a different non-deleting instance does not force spinner", () => {
  const state = deriveDeleteDialogState({
    isMultiStepDialog: true,
    isLastInstance: false,
    accountConfigStatus: "READY",
    instanceStatus: "READY",
    isDeleteInstanceMutationPending: false,
    hasRequestedDeletion: false,
  });

  assert.equal(state.isLoading, false);
  assert.equal(state.isDeletingInstance, false);
  assert.equal(state.buttonText, "Delete");
});

test("4) failure path stops spinner and supports retry behavior for non-last instances", () => {
  const failedNonLastInstanceState = deriveDeleteDialogState({
    isMultiStepDialog: false,
    isLastInstance: false,
    accountConfigStatus: "READY",
    instanceStatus: "FAILED",
    isDeleteInstanceMutationPending: false,
    hasRequestedDeletion: false,
  });

  assert.equal(failedNonLastInstanceState.isLoading, false);
  assert.equal(failedNonLastInstanceState.buttonText, "Delete");
  assert.equal(failedNonLastInstanceState.step, "delete");

  const failedLastInstanceState = deriveDeleteDialogState({
    isMultiStepDialog: true,
    isLastInstance: true,
    accountConfigStatus: "READY",
    instanceStatus: "FAILED",
    isDeleteInstanceMutationPending: false,
    hasRequestedDeletion: false,
  });

  assert.equal(failedLastInstanceState.step, "offboard");
  assert.equal(failedLastInstanceState.buttonText, "Offboard");
  assert.equal(failedLastInstanceState.isLoading, false);
});

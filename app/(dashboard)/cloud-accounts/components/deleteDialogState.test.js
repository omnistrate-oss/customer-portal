// import assert from "node:assert/strict";
// import test from "node:test";

// import {
//   deriveDeleteDialogState,
//   INSTANCE_STATUS_POLL_INTERVAL_MS,
//   MAX_POLL_COUNT,
//   shouldPollInstanceStatus,
//   shouldResetDeleteMutationOnClose,
// } from "./deleteDialogState.js";

// test("1) close dialog before delete response -> mutation reset and no stale loading for another instance", () => {
//   assert.equal(shouldResetDeleteMutationOnClose(true), true);
//   assert.equal(shouldResetDeleteMutationOnClose(false), false);

//   const accountBState = deriveDeleteDialogState({
//     isMultiStepDialog: true,
//     isLastInstance: false,
//     accountConfigStatus: "READY",
//     instanceStatus: "READY",
//     isDeleteInstanceMutationPending: false,
//     hasRequestedDeletion: false,
//   });

//   assert.equal(accountBState.isLoading, false);
//   assert.equal(accountBState.buttonText, "Delete");
//   assert.equal(accountBState.step, "delete");
// });

// test("2) poll status every 10 seconds while dialog is open and instance is deleting (max 12 polls)", () => {
//   assert.equal(INSTANCE_STATUS_POLL_INTERVAL_MS, 10_000);
//   assert.equal(MAX_POLL_COUNT, 12);

//   // Multi-step dialog with delete requested and DELETING status -> should poll
//   assert.equal(
//     shouldPollInstanceStatus({
//       open: true,
//       instanceStatus: "DELETING",
//       accountConfigStatus: "PENDING",
//       hasRefetchInstanceStatus: true,
//       isMultiStepDialog: true,
//       hasRequestedDeletion: true,
//     }),
//     true
//   );

//   // Non-multi-step dialog -> should NOT poll even with DELETING status
//   assert.equal(
//     shouldPollInstanceStatus({
//       open: true,
//       instanceStatus: "DELETING",
//       accountConfigStatus: "PENDING",
//       hasRefetchInstanceStatus: true,
//       isMultiStepDialog: false,
//       hasRequestedDeletion: true,
//     }),
//     false
//   );

//   // Multi-step with DELETING status but delete not yet requested (e.g. dialog reopened) -> should poll
//   assert.equal(
//     shouldPollInstanceStatus({
//       open: true,
//       instanceStatus: "DELETING",
//       accountConfigStatus: "PENDING",
//       hasRefetchInstanceStatus: true,
//       isMultiStepDialog: true,
//       hasRequestedDeletion: false,
//     }),
//     true
//   );

//   // Already READY_TO_OFFBOARD -> should NOT poll
//   assert.equal(
//     shouldPollInstanceStatus({
//       open: true,
//       instanceStatus: "DELETING",
//       accountConfigStatus: "READY_TO_OFFBOARD",
//       hasRefetchInstanceStatus: true,
//       isMultiStepDialog: true,
//       hasRequestedDeletion: true,
//     }),
//     false
//   );

//   // Waiting for deletion to start (status still READY, delete requested)
//   assert.equal(
//     shouldPollInstanceStatus({
//       open: true,
//       instanceStatus: "READY",
//       accountConfigStatus: "READY_TO_OFFBOARD",
//       hasRefetchInstanceStatus: true,
//       hasRequestedDeletion: true,
//       isMultiStepDialog: true,
//     }),
//     false
//   );

//   assert.equal(
//     shouldPollInstanceStatus({
//       open: true,
//       instanceStatus: "READY",
//       accountConfigStatus: "PENDING",
//       hasRefetchInstanceStatus: true,
//       hasRequestedDeletion: true,
//       isMultiStepDialog: true,
//     }),
//     true
//   );

//   // No hasRequestedDeletion -> should NOT poll
//   assert.equal(
//     shouldPollInstanceStatus({
//       open: true,
//       instanceStatus: "READY",
//       accountConfigStatus: "PENDING",
//       hasRefetchInstanceStatus: true,
//       isMultiStepDialog: true,
//     }),
//     false
//   );
// });

// test("3) close and reopen same deleting instance keeps in-progress state", () => {
//   const reopenedState = deriveDeleteDialogState({
//     isMultiStepDialog: true,
//     isLastInstance: true,
//     accountConfigStatus: "PENDING",
//     instanceStatus: "DELETING",
//     isDeleteInstanceMutationPending: false,
//     hasRequestedDeletion: false,
//   });

//   assert.equal(reopenedState.isDeletingInstance, true);
//   assert.equal(reopenedState.isLoading, true);
//   assert.equal(reopenedState.buttonText, "Deleting");
//   assert.equal(reopenedState.step, "delete");
// });

// test("4) opening a different non-deleting instance does not force spinner", () => {
//   const state = deriveDeleteDialogState({
//     isMultiStepDialog: true,
//     isLastInstance: false,
//     accountConfigStatus: "READY",
//     instanceStatus: "READY",
//     isDeleteInstanceMutationPending: false,
//     hasRequestedDeletion: false,
//   });

//   assert.equal(state.isLoading, false);
//   assert.equal(state.isDeletingInstance, false);
//   assert.equal(state.buttonText, "Delete");
// });

// test("5) polling stops on dialog close", () => {
//   assert.equal(
//     shouldPollInstanceStatus({
//       open: false,
//       instanceStatus: "DELETING",
//       accountConfigStatus: "PENDING",
//       hasRefetchInstanceStatus: true,
//       isMultiStepDialog: true,
//       hasRequestedDeletion: true,
//     }),
//     false
//   );
// });

// test("6) failure path stops spinner and supports retry behavior for non-last instances", () => {
//   const failedNonLastInstanceState = deriveDeleteDialogState({
//     isMultiStepDialog: false,
//     isLastInstance: false,
//     accountConfigStatus: "READY",
//     instanceStatus: "FAILED",
//     isDeleteInstanceMutationPending: false,
//     hasRequestedDeletion: false,
//   });

//   assert.equal(failedNonLastInstanceState.isLoading, false);
//   assert.equal(failedNonLastInstanceState.buttonText, "Delete");
//   assert.equal(failedNonLastInstanceState.step, "delete");

//   const failedLastInstanceState = deriveDeleteDialogState({
//     isMultiStepDialog: true,
//     isLastInstance: true,
//     accountConfigStatus: "READY",
//     instanceStatus: "FAILED",
//     isDeleteInstanceMutationPending: false,
//     hasRequestedDeletion: false,
//   });

//   assert.equal(failedLastInstanceState.step, "offboard");
//   assert.equal(failedLastInstanceState.buttonText, "Offboard");
//   assert.equal(failedLastInstanceState.isLoading, false);
// });

// test("7) offboard step (step 2) never requires polling — dialog closes synchronously on success", () => {
//   // DELETING + READY_TO_OFFBOARD: offboard is the next action, not a poll trigger
//   assert.equal(
//     shouldPollInstanceStatus({
//       open: true,
//       instanceStatus: "DELETING",
//       accountConfigStatus: "READY_TO_OFFBOARD",
//       isMultiStepDialog: true,
//       hasRequestedDeletion: false,
//     }),
//     false
//   );

//   // FAILED + READY_TO_OFFBOARD: same — no polling for offboard step
//   assert.equal(
//     shouldPollInstanceStatus({
//       open: true,
//       instanceStatus: "FAILED",
//       accountConfigStatus: "READY_TO_OFFBOARD",
//       isMultiStepDialog: true,
//       hasRequestedDeletion: false,
//     }),
//     false
//   );

//   // hasRequestedDeletion with READY_TO_OFFBOARD -> should NOT poll (offboard step reached)
//   assert.equal(
//     shouldPollInstanceStatus({
//       open: true,
//       instanceStatus: "DELETING",
//       accountConfigStatus: "READY_TO_OFFBOARD",
//       isMultiStepDialog: true,
//       hasRequestedDeletion: true,
//     }),
//     false
//   );

//   // Dialog closed -> should NOT poll
//   assert.equal(
//     shouldPollInstanceStatus({
//       open: false,
//       instanceStatus: "DELETING",
//       accountConfigStatus: "READY_TO_OFFBOARD",
//       isMultiStepDialog: true,
//       hasRequestedDeletion: false,
//     }),
//     false
//   );
// });

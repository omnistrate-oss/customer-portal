import { useState } from "react";
import { styled } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import useInstances from "app/(dashboard)/instances/hooks/useInstances";

import { deleteUser } from "src/api/users";
import Button from "src/components/Button/Button";
import LoadingSpinner from "src/components/LoadingSpinner/LoadingSpinner";
import { Text } from "src/components/Typography/Typography";
import useLogout from "src/hooks/useLogout";
import useSnackbar from "src/hooks/useSnackbar";
import { useProviderOrgDetails } from "src/providers/ProviderOrgDetailsProvider";

import DeleteAccountConfigConfirmationDialog from "./DeleteAccountConfirmationDialog";

const List = styled("ul")({
  listStyleType: "disc",
  padding: 0,
  margin: 0,
  marginLeft: "16px",
});

const ListItem = styled("li")({
  marginBottom: "8px",
  fontSize: "16px",
  lineHeight: "24px",
  color: "#535862",
});

const getDeleteAccountErrorMessage = (error: unknown) => {
  const maybeError = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
    message?: string;
  };

  const backendMessage = maybeError?.response?.data?.message || maybeError?.message || "";
  const message = backendMessage.toLowerCase();

  if (
    message.includes("unpaid usage") ||
    message.includes("pending invoice") ||
    message.includes("draft invoice") ||
    message.includes("current month usage") ||
    message.includes("current-month usage")
  ) {
    return "This account cannot be deleted while pending billing items exist. Please contact support for assistance.";
  }

  if (message.includes("unpaid invoice") || message.includes("open invoice")) {
    return "Please resolve unpaid invoices before deleting your account. Please contact support if you need help.";
  }

  if (message.includes("active instance")) {
    return "Please delete all active instances before deleting your account.";
  }

  return "Failed to delete your account. Please try again or contact support.";
};

function DeleteAccount() {
  const { orgName } = useProviderOrgDetails();
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const { handleLogout } = useLogout();
  const snackbar = useSnackbar();

  const { data: instances = [], isPending: isInstancesPending } = useInstances({ refetchOnMount: false });

  function handleDialogOpen() {
    setConfirmationDialogOpen(true);
  }
  function handleDialogClose() {
    setConfirmationDialogOpen(false);
  }

  const deleteAccountMutation = useMutation({
    mutationFn: () => {
      return deleteUser();
    },
    onSuccess: () => {
      snackbar.showSuccess("Your account has been successfully deleted");
      handleLogout();
    },
    onError: (error) => {
      snackbar.showError(getDeleteAccountErrorMessage(error));
    },
  });

  if (isInstancesPending) return <LoadingSpinner />;

  return (
    <>
      <div className="border border-[#E9EAEB] rounded-[12px]">
        <div className="px-6 py-5 border-b border-[#E9EAEB]">
          <Text size="large" weight="semibold" color="#181D27">
            Delete Account
          </Text>
          <Text size="small" weight="regular" color="#535862" sx={{ marginTop: "2px" }}>
            Permanently delete your account and associated data from {orgName}
          </Text>
        </div>
        <div>
          <div className="px-8 py-10">
            <Text size="medium" weight="medium" color="#181D27">
              Delete Account
            </Text>
            <Text size="medium" weight="regular" color="#535862" sx={{ marginTop: "12px" }}>
              Upon deletion, the following data will be permanently removed:
              <List sx={{ marginTop: "20px" }}>
                <ListItem>Your profile information (name, email, login credentials)</ListItem>
                <ListItem>Access tokens, and CLI configurations </ListItem>
                <ListItem>Activity logs associated with your account</ListItem>
              </List>
            </Text>
            <div className="mt-6 bg-[#FAFAFA] p-4 border border-[#E9EAEB] rounded-[8px]">
              <Text size="medium" weight="semibold" color="#D92D20">
                Important to know:
              </Text>
              <List sx={{ marginTop: "12px" }}>
                <ListItem>This action is irreversible.</ListItem>
                <ListItem>You will lose access to {orgName} subscriptions immediately after deletion.</ListItem>
              </List>
            </div>
          </div>
          <div className="ml-5 mr-5 p-5 border-t border-[#E9EAEB] flex justify-end gap-3">
            <Button
              bgColor="#D92D20"
              variant="contained"
              onClick={handleDialogOpen}
              disabled={instances.length > 0}
              disabledMessage="Please delete all instances to continue with account deletion"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>
      <DeleteAccountConfigConfirmationDialog
        open={confirmationDialogOpen}
        handleClose={handleDialogClose}
        handleSubmit={() => {
          deleteAccountMutation.mutate();
        }}
        isLoading={deleteAccountMutation.isPending}
      />
    </>
  );
}

export default DeleteAccount;

"use client";

import { Add } from "@mui/icons-material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { InputAdornment } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { FieldArray, FormikProvider, getIn, useFormik } from "formik";
import { cn } from "lib/utils";

import { inviteSubscriptionUser } from "src/api/users";
import FieldError from "src/components/FormElementsv2/FieldError/FieldError";
import useSnackbar from "src/hooks/useSnackbar";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { colors } from "src/themeConfig";
import { Subscription } from "src/types/subscription";
import Button from "components/Button/Button";
import LoadingSpinnerSmall from "components/CircularProgress/CircularProgress";
import Form from "components/FormElementsv2/Form/Form";
import MenuItem from "components/FormElementsv2/MenuItem/MenuItem";
import Select from "components/FormElementsv2/Select/Select";
import TextField from "components/FormElementsv2/TextField/TextField";
import DataGridHeaderTitle from "components/Headers/DataGridHeaderTitle";
import DeleteIcon from "components/Icons/Delete/Delete";
import { Text } from "components/Typography/Typography";

import { inviteUsersValidationSchema } from "../utils";

const getNewEnvVariable = () => {
  return {
    email: "",
    roleType: "",
    serviceId: "",
    servicePlanId: "",
  };
};

const getServiceMenuItems = (subscriptions: Subscription[]) => {
  const serviceIdSet = new Set();

  const serviceMenuItems = subscriptions
    .filter((sub) => sub.roleType === "root")
    .map((sub) => {
      if (!serviceIdSet.has(sub.serviceId)) {
        serviceIdSet.add(sub.serviceId);
        return {
          label: sub.serviceName,
          value: sub.serviceId,
        };
      }
      return null;
    });

  return (
    serviceMenuItems
      .filter((item) => item !== null)
      // @ts-ignore
      .sort((a, b) => a?.label.localeCompare(b?.label)) as {
      label: string;
      value: string;
    }[]
  );
};

const getServicePlanMenuItems = (subscriptions: Subscription[], serviceId: string) => {
  const servicePlanMenuItems = subscriptions
    ?.filter((sub) => sub.serviceId === serviceId && sub.roleType === "root")
    .map((sub) => {
      return {
        label: sub.productTierName,
        value: sub.productTierId,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
  return servicePlanMenuItems;
};

type InviteUsersCardProps = {
  refetchUsers: () => void;
  isFetchingUsers?: boolean;
};

interface UserInvite {
  email: string;
  roleType: string;
  serviceId: string;
  servicePlanId: string;
}

// Define the interface for the entire form values
interface InviteUsersFormValues {
  userInvite: UserInvite[];
}

const InviteUsersCard: React.FC<InviteUsersCardProps> = ({ refetchUsers, isFetchingUsers }) => {
  const snackbar = useSnackbar();
  const { subscriptions, isSubscriptionsPending } = useGlobalData();

  const createUserInvitesMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        await Promise.all(
          data.userInvite.map((d) => {
            const payload = {
              email: d.email.trim(),
              roleType: d.roleType,
            };

            const rootSubscription = subscriptions.find(
              (sub) => sub.serviceId === d.serviceId && sub.productTierId === d.servicePlanId && sub.roleType === "root"
            );
            return inviteSubscriptionUser(rootSubscription?.id, payload);
          })
        );
        snackbar.showSuccess("Invites Sent");
        // eslint-disable-next-line no-use-before-define
        formData.resetForm();
      } catch {
        snackbar.showError("Some of the invites failed to send. Please review the access permissions and try again.");
      } finally {
        refetchUsers();
      }
    },
  });

  const formData = useFormik<InviteUsersFormValues>({
    initialValues: {
      userInvite: [
        {
          email: "",
          roleType: "",
          serviceId: "",
          servicePlanId: "",
        },
      ],
    },
    onSubmit: (values) => {
      const valuesToBeSubmitted = structuredClone(values);

      for (let i = 0; i < valuesToBeSubmitted?.userInvite?.length; i++) {
        if (valuesToBeSubmitted.userInvite[i]["roleType"] === "Editor") {
          valuesToBeSubmitted.userInvite[i]["roleType"] = "editor";
        }
        if (valuesToBeSubmitted.userInvite[i]["roleType"] === "Reader") {
          valuesToBeSubmitted.userInvite[i]["roleType"] = "reader";
        }
      }
      createUserInvitesMutation.mutate(valuesToBeSubmitted);
    },
    validationSchema: inviteUsersValidationSchema,
  });

  const { values, handleChange, handleBlur, setFieldValue } = formData;

  return (
    <div className="shadow-[0_1px_2px_0_#0A0D120D] rounded-xl border border-[#E9EAEB] bg-white mb-6">
      {/* @ts-ignore */}
      <Form onSubmit={formData.handleSubmit}>
        <FormikProvider value={formData}>
          <div className="flex items-center justify-between gap-4 pt-4 px-6">
            <DataGridHeaderTitle
              title="Invite Users"
              desc="Invite team members with specific roles to manage your Product subscriptions"
            />

            <Button
              data-testid="send-invites-button"
              variant="contained"
              type="submit"
              disabled={createUserInvitesMutation.isPending || isFetchingUsers}
            >
              Send Invites
              {createUserInvitesMutation.isPending && <LoadingSpinnerSmall />}
            </Button>
          </div>

          <div className="p-8">
            <div className="space-y-4 max-w-6xl mx-auto">
              <FieldArray
                name="userInvite"
                render={({ remove, push }) => {
                  return (
                    <>
                      {values.userInvite.map((invite, index) => {
                        const serivceMenuItems = getServiceMenuItems(subscriptions);

                        const servicePlanMenuItems = getServicePlanMenuItems(
                          subscriptions,
                          values.userInvite[index].serviceId
                        );

                        return (
                          <div className="flex items-start flex-wrap gap-4" key={index}>
                            <div className="flex-1 max-w-60">
                              <TextField
                                data-testid="email-input"
                                required
                                placeholder="you@example.com"
                                value={invite.email}
                                onChange={handleChange}
                                name={`userInvite[${index}].email`}
                                disabled={createUserInvitesMutation.isPending || isFetchingUsers}
                                sx={{
                                  minWidth: "240px",
                                  mt: 0,
                                  "& .MuiInputAdornment-root": {
                                    border: "none", // Remove the default border of Input Adornment
                                    paddingRight: "0px",
                                  },
                                }}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <EmailOutlinedIcon />
                                    </InputAdornment>
                                  ),
                                }}
                              />
                              <FieldError mt="4px">
                                {getIn(formData.touched, `userInvite[${index}].email`) &&
                                  getIn(formData.errors, `userInvite[${index}].email`)}
                              </FieldError>
                            </div>

                            <div className="flex-1 max-w-60">
                              <Select
                                data-testid="service-select"
                                required
                                isLoading={isSubscriptionsPending}
                                name={`userInvite[${index}].serviceId`}
                                value={invite.serviceId}
                                onBlur={handleBlur}
                                disabled={createUserInvitesMutation.isPending || isFetchingUsers}
                                onChange={(e) => {
                                  handleChange(e);
                                  setFieldValue(`userInvite[${index}].servicePlanId`, "");
                                }}
                                sx={{ mt: 0 }}
                                displayEmpty
                                renderValue={(value) => {
                                  if (!value) return "Product";
                                  return serivceMenuItems.find((item) => item.value === value)?.label;
                                }}
                                maxWidth="400px"
                              >
                                {serivceMenuItems?.length > 0 ? (
                                  serivceMenuItems.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                      {option.label}
                                    </MenuItem>
                                  ))
                                ) : (
                                  <MenuItem value="" disabled>
                                    <i>No Products With Root Access</i>
                                  </MenuItem>
                                )}
                              </Select>
                              <FieldError mt="4px">
                                {getIn(formData.touched, `userInvite[${index}].serviceId`) &&
                                  getIn(formData.errors, `userInvite[${index}].serviceId`)}
                              </FieldError>
                            </div>

                            <div className="flex-1 max-w-60">
                              <Select
                                data-testid="subscription-plan-select"
                                required
                                isLoading={isSubscriptionsPending}
                                name={`userInvite[${index}].servicePlanId`}
                                value={invite.servicePlanId}
                                onBlur={handleBlur}
                                onChange={handleChange}
                                disabled={createUserInvitesMutation.isPending || isFetchingUsers}
                                sx={{ mt: 0 }}
                                displayEmpty
                                renderValue={(value) => {
                                  if (!value) return "Subscription Plan";
                                  return servicePlanMenuItems.find((item) => item.value === value)?.label;
                                }}
                                maxWidth="400px"
                              >
                                {servicePlanMenuItems?.length > 0 ? (
                                  servicePlanMenuItems.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                      {option.label}
                                    </MenuItem>
                                  ))
                                ) : (
                                  <MenuItem value="" disabled>
                                    <i>{invite.serviceId ? "No subscription plans" : "Select a Product first"}</i>
                                  </MenuItem>
                                )}
                              </Select>
                              <FieldError mt="4px">
                                {getIn(formData.touched, `userInvite[${index}].servicePlanId`) &&
                                  getIn(formData.errors, `userInvite[${index}].servicePlanId`)}
                              </FieldError>
                            </div>

                            <div className="flex-1 max-w-60">
                              <Select
                                data-testid="role-select"
                                required
                                name={`userInvite[${index}].roleType`}
                                value={invite.roleType}
                                onChange={handleChange}
                                sx={{ mt: 0 }}
                                displayEmpty
                                disabled={createUserInvitesMutation.isPending || isFetchingUsers}
                                renderValue={(value) => {
                                  if (value) return value;
                                  return "Role";
                                }}
                                maxWidth="400px"
                              >
                                {["Editor", "Reader"].map((option) => (
                                  <MenuItem key={option} value={option}>
                                    {option}
                                  </MenuItem>
                                ))}
                              </Select>
                              <FieldError mt="4px">
                                {getIn(formData.touched, `userInvite[${index}].roleType`) &&
                                  getIn(formData.errors, `userInvite[${index}].roleType`)}
                              </FieldError>
                            </div>

                            <div
                              onClick={() => {
                                remove(index);
                              }}
                              className={cn(
                                "cursor-pointer border border-error-700 h-10 w-10 rounded-md flex items-center justify-center",
                                index === 0 ? "invisible" : "visible"
                              )}
                            >
                              <DeleteIcon color={colors.error700} />
                            </div>
                          </div>
                        );
                      })}

                      <div
                        data-testid="add-another-button"
                        className="inline-flex items-center gap-1.5 mt-4 cursor-pointer"
                        onClick={() => {
                          push(getNewEnvVariable());
                        }}
                      >
                        <Add sx={{ color: colors.gray700 }} />
                        <Text size="small" weight="semibold" color={colors.gray700}>
                          Add Another
                        </Text>
                      </div>
                    </>
                  );
                }}
              />
            </div>
          </div>
        </FormikProvider>
      </Form>
    </div>
  );
};

export default InviteUsersCard;

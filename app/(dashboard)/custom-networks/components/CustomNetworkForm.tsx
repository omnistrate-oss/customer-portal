"use client";

import CloudProviderRadio from "app/(dashboard)/components/CloudProviderRadio/CloudProviderRadio";
import { useFormik } from "formik";
import { useMemo } from "react";

import GridDynamicForm from "components/DynamicForm/GridDynamicForm";
import { FormConfiguration } from "components/DynamicForm/types";
import { $api } from "src/api/query";
import Switch from "src/components/Switch/Switch";
import Tooltip from "src/components/Tooltip/Tooltip";
import { CLOUD_PROVIDERS, cloudProviderLongLogoMap } from "src/constants/cloudProviders";
import useSnackbar from "src/hooks/useSnackbar";

import { CustomNetworkValidationSchema } from "../constants";
import useSubscriptionOwners from "../hooks/useSubscriptionOwners";

const CustomNetworkForm = ({
  formMode,
  regions,
  isFetchingRegions,
  refetchCustomNetworks,
  onClose,
  selectedCustomNetwork,
}) => {
  const snackbar = useSnackbar();
  const { data: subscriptionOwners = [], isFetching: isFetchingSubscriptionOwners } = useSubscriptionOwners();

  const createCustomNetworkMutation = $api.useMutation("post", "/2022-09-01-00/resource-instance/custom-network", {
    onSuccess: () => {
      onClose();
      snackbar.showSuccess("Customer Network created successfully");
      refetchCustomNetworks();
    },
  });

  const updateCustomNetworkMutation = $api.useMutation(
    "patch",
    "/2022-09-01-00/resource-instance/custom-network/{id}",
    {
      onSuccess: () => {
        onClose();
        snackbar.showSuccess("Customer Network updated successfully");
        refetchCustomNetworks();
      },
    }
  );

  const formData = useFormik({
    initialValues: {
      name: selectedCustomNetwork?.name || "",
      cloudProviderName: selectedCustomNetwork?.cloudProviderName || "aws",
      cloudProviderRegion: selectedCustomNetwork?.cloudProviderRegion || "",
      cidr: selectedCustomNetwork?.cidr || "",
      shareViaSubscriptionOwner: false,
      subscriptionOwnerId: "",
    },
    validationSchema: CustomNetworkValidationSchema,
    onSubmit: (values) => {
      const data: Record<string, unknown> = {
        name: values.name,
        cloudProviderName: values.cloudProviderName,
        cloudProviderRegion: values.cloudProviderRegion,
        cidr: values.cidr,
      };

      if (formMode === "create") {
        if (values.shareViaSubscriptionOwner && values.subscriptionOwnerId) {
          data.orgId = values.subscriptionOwnerId;
        }
        createCustomNetworkMutation.mutate({
          body: data as Parameters<typeof createCustomNetworkMutation.mutate>[0]["body"],
        });
      } else {
        updateCustomNetworkMutation.mutate({
          params: {
            path: {
              id: selectedCustomNetwork.id,
            },
          },
          body: {
            name: values.name,
          },
        });
      }
    },
  });

  const regionMenuItems = useMemo(() => {
    return regions
      .filter((region) => region.cloudProviderName === formData.values.cloudProviderName)
      .map((region) => {
        return {
          value: region.code,
          label: region.code,
        };
      });
  }, [regions, formData.values.cloudProviderName]);

  const cloudProviders = useMemo(() => {
    return (
      regions
        .reduce((acc, region) => {
          if (!acc.includes(region.cloudProviderName)) {
            acc.push(region.cloudProviderName);
          }
          return acc;
        }, [])
        .filter((provider) => Object.values(CLOUD_PROVIDERS).includes(provider))
        // Sort as ['aws', 'azure', 'gcp', 'oci']
        .sort((a, b) => a.localeCompare(b))
    );
  }, [regions]);

  const subscriptionOwnerMenuItems = useMemo(() => {
    return subscriptionOwners.map((user) => ({
      value: user.userId,
      label: `${user.name} - ${user.email}`,
    }));
  }, [subscriptionOwners]);

  const formConfiguration: FormConfiguration = useMemo(() => {
    return {
      title: {
        create: "Create Customer Network",
        modify: "Modify Customer Network",
      },
      description: {
        create: "Create new customer network with the specified details",
        modify: "Update the customer network",
      },
      footer: {
        submitButton: {
          create: "Create",
          modify: "Update",
        },
      },
      sections: [
        {
          title: "Standard Information",
          fields: [
            {
              dataTestId: "name-input",
              label: "Name",
              subLabel: "The unique name for the customer network for easy reference",
              name: "name",
              type: "text",
              required: true,
            },
            {
              label: "Cloud Provider",
              subLabel: "Select the cloud provider",
              name: "cloudProviderName",
              required: true,
              customComponent: (
                <CloudProviderRadio
                  cloudProviders={cloudProviders}
                  name="cloudProviderName"
                  formData={formData}
                  onChange={() => {
                    formData.setFieldValue("cloudProviderRegion", "");
                    formData.setFieldTouched("cloudProviderRegion", false);
                  }}
                  disabled={formMode === "modify"}
                />
              ),
              previewValue: formData.values.cloudProviderName
                ? () => {
                    const cloudProvider = formData.values.cloudProviderName;
                    return cloudProviderLongLogoMap[cloudProvider] || "-";
                  }
                : null,
            },
            {
              dataTestId: "region-select",
              label: "Region",
              subLabel: "Choose the cloud provider region",
              name: "cloudProviderRegion",
              type: "select",
              required: true,
              isLoading: isFetchingRegions,
              menuItems: regionMenuItems,
              disabled: formMode === "modify",
            },
            {
              dataTestId: "cidr-input",
              label: "CIDR",
              subLabel: "CIDR block for the network",
              name: "cidr",
              type: "text",
              required: true,
              disabled: formMode === "modify",
            },
            {
              dataTestId: "share-via-subscription-owner-toggle",
              label: "Share via subscription owner",
              subLabel: "Turn on to share this network with the subscription owner",
              name: "shareViaSubscriptionOwner",
              isHidden: formMode === "modify",
              customComponent: (
                <Tooltip
                  title={
                    !subscriptionOwnerMenuItems.length
                      ? "No subscription owners available. Please ensure there are users with active subscriptions."
                      : ""
                  }
                >
                  <span>
                    <Switch
                      checked={formData.values.shareViaSubscriptionOwner}
                      disabled={!subscriptionOwnerMenuItems.length}
                      onChange={(e) => {
                        formData.setFieldValue("shareViaSubscriptionOwner", e.target.checked);
                        if (!e.target.checked) {
                          formData.setFieldValue("subscriptionOwnerId", "");
                          formData.setFieldTouched("subscriptionOwnerId", false);
                        }
                      }}
                    />
                  </span>
                </Tooltip>
              ),
            },
            {
              dataTestId: "subscription-owner-select",
              label: "Subscription Owner",
              subLabel: "Select the subscription owner for this shared network.",
              name: "subscriptionOwnerId",
              type: "select",
              required: true,
              isLoading: isFetchingSubscriptionOwners,
              menuItems: subscriptionOwnerMenuItems,
              isHidden: formMode === "modify" || !formData.values.shareViaSubscriptionOwner,
              previewValue: formData.values.subscriptionOwnerId
                ? (() => {
                    const owner = subscriptionOwnerMenuItems.find(
                      (item) => item.value === formData.values.subscriptionOwnerId
                    );
                    return owner?.label || formData.values.subscriptionOwnerId;
                  })()
                : null,
            },
          ],
        },
      ],
    };
  }, [
    cloudProviders,
    isFetchingRegions,
    isFetchingSubscriptionOwners,
    regionMenuItems,
    subscriptionOwnerMenuItems,
    formData.values,
    formMode,
  ]);

  return (
    <GridDynamicForm
      formConfiguration={formConfiguration}
      formData={formData}
      formMode={formMode}
      onClose={onClose}
      isFormSubmitting={createCustomNetworkMutation.isPending || updateCustomNetworkMutation.isPending}
      previewCardTitle="Customer Network Summary"
    />
  );
};

export default CustomNetworkForm;

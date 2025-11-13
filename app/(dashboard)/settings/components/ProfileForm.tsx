"use client";

import { useFormik } from "formik";

import { $api } from "src/api/query";
import useSnackbar from "src/hooks/useSnackbar";
import Button from "components/Button/Button";
import LoadingSpinnerSmall from "components/CircularProgress/CircularProgress";
import FieldError from "components/FormElementsv2/FieldError/FieldError";
import FieldTitle from "components/FormElementsv2/FieldTitle/FieldTitle";
import Form from "components/FormElementsv2/Form/Form";
import TextField from "components/FormElementsv2/TextField/TextField";

import { FieldCell, FieldTitleCell, ProfileValidationSchema } from "./Common";
import FormHeader from "./FormHeader";

type ProfileFormProps = {
  userData: any;
  isLoadingUserData?: boolean;
  refetchUserData: () => void;
};

const ProfileForm: React.FC<ProfileFormProps> = ({ userData, isLoadingUserData, refetchUserData }) => {
  const snackbar = useSnackbar();

  const updateProfileMutation = $api.useMutation("patch", "/2022-09-01-00/user/{id}", {
    onSuccess: () => {
      refetchUserData();
      snackbar.showSuccess("Profile updated successfully");
    },
  });

  const formData = useFormik({
    initialValues: {
      name: userData?.name || "",
      orgName: userData?.orgName || "",
      orgDescription: userData?.orgDescription || "",
      orgURL: userData?.orgURL || "",
      orgId: userData?.orgId || "",
      affiliateCode: userData?.attributes?.affiliateCode || "",
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      const data: typeof values & { attributes?: Record<string, string> } = { ...values };
      // Remove Empty Fields
      for (const key in data) {
        if (data[key] === "" && key !== "affiliateCode") {
          delete data[key];
        }
      }

      data.attributes = {
        affiliateCode: data.affiliateCode,
      };

      delete data.affiliateCode;

      updateProfileMutation.mutate({
        params: {
          path: {
            id: userData.id,
          },
        },
        body: data,
      });
    },
    validationSchema: ProfileValidationSchema,
  });

  const { values, handleChange, handleBlur, touched, errors } = formData;

  return (
    <div>
      <FormHeader
        title="Personal Info"
        description="Update your personal details here"
        className="pb-5 mb-6 border-b border-[#E9EAEB]"
      />

      {/* @ts-ignore */}
      <Form onSubmit={formData.handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-y-5">
          <FieldTitleCell>
            <FieldTitle required>Name</FieldTitle>
          </FieldTitleCell>
          <FieldCell>
            <TextField
              data-testid="name-input"
              name="name"
              id="name"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoadingUserData}
              sx={{ mt: 0 }}
            />
            <FieldError>{touched.name && errors.name}</FieldError>
          </FieldCell>

          <FieldTitleCell>
            <FieldTitle required>Organization ID</FieldTitle>
          </FieldTitleCell>
          <FieldCell>
            <TextField data-testid="organization-id-input" readOnly disabled value={values.orgId} sx={{ mt: 0 }} />
          </FieldCell>

          <FieldTitleCell>
            <FieldTitle required>Organization Name</FieldTitle>
          </FieldTitleCell>
          <FieldCell>
            <TextField
              data-testid="organization-name-input"
              name="orgName"
              id="orgName"
              value={values.orgName}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoadingUserData || userData.roleType !== "root"}
              sx={{ mt: 0 }}
            />
            <FieldError>{touched.orgName && errors.orgName}</FieldError>
          </FieldCell>

          <FieldTitleCell>
            <FieldTitle>Organization Website URL</FieldTitle>
          </FieldTitleCell>
          <FieldCell>
            <TextField
              data-testid="organization-url-input"
              name="orgURL"
              id="orgURL"
              value={values.orgURL}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoadingUserData || userData.roleType !== "root"}
              sx={{ mt: 0 }}
            />
            <FieldError>{touched.orgURL && errors.orgURL}</FieldError>
          </FieldCell>

          <FieldTitleCell>
            <FieldTitle>Affiliation Code</FieldTitle>
          </FieldTitleCell>
          <FieldCell>
            <TextField
              data-testid="affiliate-code"
              name="affiliateCode"
              id="affiliateCode"
              value={values.affiliateCode}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoadingUserData || userData.roleType !== "root"}
              sx={{ mt: 0 }}
            />
            <FieldError>{touched.orgURL && errors.orgURL}</FieldError>
          </FieldCell>
        </div>

        <div className="flex items-center justify-end gap-4 mt-5">
          <Button variant="outlined" onClick={() => formData.resetForm()} disabled={updateProfileMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={updateProfileMutation.isPending}>
            Save
            {updateProfileMutation.isPending && <LoadingSpinnerSmall />}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ProfileForm;

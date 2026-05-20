"use client";

import { useMemo } from "react";
import { useFormik } from "formik";

import { $api } from "src/api/query";
import useSnackbar from "src/hooks/useSnackbar";
import Button from "components/Button/Button";
import LoadingSpinnerSmall from "components/CircularProgress/CircularProgress";
import Autocomplete from "components/FormElementsv2/AutoComplete/AutoComplete";
import FieldError from "components/FormElementsv2/FieldError/FieldError";
import FieldTitle from "components/FormElementsv2/FieldTitle/FieldTitle";
import Form from "components/FormElementsv2/Form/Form";
import TextField from "components/FormElementsv2/TextField/TextField";

import { countriesAlpha3 } from "../constants";

import { BillingAddressValidationSchema, FieldCell, FieldTitleCell } from "./Common";
import FormHeader from "./FormHeader";

type BillingAddressFormProps = {
  userData: any;
  isLoadingUserData?: boolean;
  refetchUserData: () => void;
};

const BillingAddressForm: React.FC<BillingAddressFormProps> = ({ userData, isLoadingUserData, refetchUserData }) => {
  const snackbar = useSnackbar();

  const updateProfileMutation = $api.useMutation("patch", "/2022-09-01-00/user/{id}", {
    onSuccess: () => {
      refetchUserData();
      snackbar.showSuccess("Billing address updated successfully");
    },
  });

  const formData = useFormik({
    initialValues: {
      address: {
        addressLine1: userData?.address?.addressLine1 || "",
        addressLine2: userData?.address?.addressLine2 || "",
        city: userData?.address?.city || "",
        country: userData?.address?.country || "",
        state: userData?.address?.state || "",
        zip: userData?.address?.zip || "",
      },
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      const data = { ...values, address: { ...values.address } };
      // Trim string address fields
      for (const key in data.address) {
        if (typeof data.address[key] === "string") {
          data.address[key] = data.address[key].trim();
        }
      }
      // Remove Empty Fields
      for (const key in data) {
        if (data[key] === "") {
          delete data[key];
        }
      }

      updateProfileMutation.mutate({
        params: {
          path: {
            id: userData?.id,
          },
        },
        body: data,
      });
    },
    validationSchema: BillingAddressValidationSchema,
  });

  const { values, handleChange, handleBlur, touched, errors } = formData;
  const isDisabled = updateProfileMutation.isPending || isLoadingUserData || userData?.roleType !== "root";

  const currentCountry = useMemo(() => {
    const alpha3Code = values.address.country;

    if (alpha3Code) {
      const match = countriesAlpha3.find((country) => country["alpha-3"].toLowerCase() === alpha3Code.toLowerCase());
      return match;
    }
    return null;
  }, [values.address.country]);

  return (
    <div>
      <FormHeader
        title="Billing Address"
        description="Update your billing address here"
        className="pb-5 mb-6 border-b border-[#E9EAEB]"
      />

      {/* @ts-ignore */}
      <Form onSubmit={formData.handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-y-5">
          <FieldTitleCell>
            <FieldTitle required>Address Line 1</FieldTitle>
          </FieldTitleCell>

          <FieldCell>
            <TextField
              data-testid="address-line-1"
              name="address.addressLine1"
              id="address.addressLine1"
              value={values.address.addressLine1}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isDisabled}
              sx={{ mt: 0 }}
            />
            <FieldError>{touched.address?.addressLine1 && errors.address?.addressLine1}</FieldError>
          </FieldCell>

          <FieldTitleCell>
            <FieldTitle>Address Line 2</FieldTitle>
          </FieldTitleCell>
          <FieldCell>
            <TextField
              data-testid="address-line-2"
              name="address.addressLine2"
              id="address.addressLine2"
              value={values.address.addressLine2}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isDisabled}
              sx={{ mt: 0 }}
            />
            <FieldError>{touched.address?.addressLine2 && errors.address?.addressLine2}</FieldError>
          </FieldCell>

          <FieldTitleCell>
            <FieldTitle required>City</FieldTitle>
          </FieldTitleCell>
          <FieldCell>
            <TextField
              data-testid="city"
              name="address.city"
              id="address.city"
              value={values.address.city}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isDisabled}
              sx={{ mt: 0 }}
            />
            <FieldError>{touched.address?.city && errors.address?.city}</FieldError>
          </FieldCell>

          <FieldTitleCell>
            <FieldTitle required>State</FieldTitle>
          </FieldTitleCell>
          <FieldCell>
            <TextField
              data-testid="state"
              name="address.state"
              id="address.state"
              value={values.address.state}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isDisabled}
              sx={{ mt: 0 }}
            />
            <FieldError>{touched.address?.state && errors.address?.state}</FieldError>
          </FieldCell>

          <FieldTitleCell>
            <FieldTitle required>Country</FieldTitle>
          </FieldTitleCell>
          <FieldCell>
            <Autocomplete
              data-testid="country"
              options={countriesAlpha3}
              value={currentCountry}
              getOptionLabel={(option) => {
                if (option.name) return option.name;
                return "Select a country";
              }}
              onChange={(e, newValue) => {
                formData.setFieldValue("address.country", newValue?.["alpha-3"]?.toLowerCase());
              }}
              onBlur={() => {
                formData.setFieldTouched("address.country", true);
              }}
              disabled={isDisabled}
            />
            <FieldError>{touched.address?.country && errors.address?.country}</FieldError>
          </FieldCell>

          <FieldTitleCell>
            <FieldTitle required>Zipcode</FieldTitle>
          </FieldTitleCell>
          <FieldCell>
            <TextField
              data-testid="zipcode"
              name="address.zip"
              id="address.zip"
              value={values.address.zip}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isDisabled}
              sx={{ mt: 0 }}
            />
            <FieldError>{touched.address?.zip && errors.address?.zip}</FieldError>
          </FieldCell>
        </div>

        <div className="flex items-center justify-end gap-4 mt-5">
          <Button
            variant="outlined"
            onClick={() => {
              formData.resetForm();
            }}
            disabled={updateProfileMutation.isPending || isLoadingUserData}
          >
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={updateProfileMutation.isPending || isLoadingUserData}>
            Save
            {updateProfileMutation.isPending && <LoadingSpinnerSmall />}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default BillingAddressForm;

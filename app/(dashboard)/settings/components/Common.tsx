import * as yup from "yup";

import { isPasswordSameAsEmail, passwordMatchesEmailText, passwordRegex, passwordText } from "src/utils/passwordRegex";

export const FieldCell = ({ children }) => (
  <div className="col-span-3 pb-5 border-b border-[#E9EAEB] lg:pl-8">
    <div className="max-w-2xl">{children}</div>
  </div>
);

export const FieldTitleCell = ({ children }) => <div className="lg:pb-5 lg:border-b border-[#E9EAEB]">{children}</div>;

export const ProfileValidationSchema = yup.object({
  name: yup.string().required("Name is required"),
  orgName: yup.string().required("Organization Name is required"),
  orgURL: yup
    .string()
    .matches(
      /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]{1,3})*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
      "Please enter a valid URL"
    ),
});

export const BillingAddressValidationSchema = yup.object({
  address: yup.object({
    addressLine1: yup.string().required("Address Line 1 is required"),
    addressLine2: yup.string(),
    city: yup.string().required("City is required"),
    country: yup.string().required("Country is required"),
    state: yup.string().required("State is required"),
    zip: yup.string().required("Zipcode is required"),
  }),
});

export const getPasswordValidationSchema = (email: string) =>
  yup.object({
    currentPassword: yup.string().required("Current Password is required"),
    newPassword: yup
      .string()
      .required("New Password is required")
      .matches(passwordRegex, passwordText)
      .test("password-not-email", passwordMatchesEmailText, (value) => {
        return !isPasswordSameAsEmail(value, email);
      }),
    confirmPassword: yup
      .string()
      .required("Confirm Password is required")
      .oneOf([yup.ref("newPassword"), null], "Passwords must match"),
  });

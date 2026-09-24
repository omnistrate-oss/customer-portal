---
name: forms
description: Use when building or changing a form in the customer portal — create and modify drawers (FullScreenDrawer with GridDynamicForm and FormConfiguration), in-page settings forms, dialogs with inputs, Formik state, Yup validation schemas, FormElementsv2 fields (TextField, Select, PasswordField, AutoComplete, Radio, FieldTitle, FieldError), cancel and reset behavior, submit loading states, form value types, and sensitive fields such as passwords, instance secrets and payment details.
---

# Forms

Formik owns form state, Yup validates it, FormElementsv2 renders the fields and an `$api` mutation submits it. Components and styling rules are in `.agents/skills/ui-and-styling/SKILL.md`; mutations and cache updates in `.agents/skills/data-fetching/SKILL.md`; message copy in section 7 of `.agents/skills/frontend-feature-development/SKILL.md`.

| Form                                                | Reference                                                                                                                                                                                    |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create or modify a resource in a full-screen drawer | `app/(dashboard)/custom-networks/components/CustomNetworkForm.tsx` (rendered by `app/(dashboard)/custom-networks/page.tsx`); larger: `app/(dashboard)/instances/components/InstanceForm.tsx` |
| In-page settings form with Save and Cancel          | `app/(dashboard)/settings/components/BillingAddressForm.tsx`, `app/(dashboard)/settings/components/ProfileForm.tsx` (schemas in `app/(dashboard)/settings/components/Common.tsx`)            |
| Repeating rows (`FieldArray`)                       | `app/(dashboard)/access-control/components/InviteUsersCard.tsx` (schema in `app/(dashboard)/access-control/utils.ts`)                                                                        |
| Type-to-confirm                                     | `TextConfirmationDialog` manages its own form; do not rebuild it                                                                                                                             |

## 1. Formik and Yup

- Use `useFormik` with a Yup `validationSchema`, always `[formik-requires-yup]`. Validation in the client is for the customer's benefit; the backend still validates.
- Yup is version 0.32: `import * as yup from "yup";`.
- Keep the schema next to the form, following the route's convention: `constants.tsx` (`CustomNetworkValidationSchema`), `utils.ts` (`getInviteUsersValidationSchema`), or a shared `Common.tsx`. Use a factory (`getPasswordValidationSchema(email)`) when the schema depends on props.
- Reuse existing validators: `passwordRegex`, `passwordText` and `isPasswordSameAsEmail` from `src/utils/passwordRegex.js`.
- Type the values: `useFormik<InviteUsersFormValues>(...)`. Derive field types from `src/types/<feature>.ts` with `Pick` (and `Required` when the form needs every field), not by retyping API shapes.
- Edit forms that load their data asynchronously set `enableReinitialize: true` (both settings forms do) instead of copying query data into the form from an effect.
- Trim strings in `onSubmit` before sending (`values.name.trim()`), and send only what the endpoint expects.

```ts
const formData = useFormik({
  initialValues: { name: selected?.name ?? "", cidr: selected?.cidr ?? "" },
  validationSchema: CustomNetworkValidationSchema,
  onSubmit: (values) => {
    createMutation.mutate({ body: { name: values.name.trim(), cidr: values.cidr.trim() } });
  },
});
```

## 2. Drawer forms: `FullScreenDrawer` plus `GridDynamicForm`

Create and modify flows open a `FullScreenDrawer` (`app/(dashboard)/components/FullScreenDrawer/FullScreenDrawer.tsx`) whose content is a `GridDynamicForm` (`src/components/DynamicForm/GridDynamicForm.tsx`). The form lays out cards of fields on the left and a live preview with the Cancel and Submit buttons on the right.

```tsx
<FullScreenDrawer
  title="Create Customer Network"
  description="Create a new customer network with the specified details"
  open={isOverlayOpen && ["create-custom-network", "modify-custom-network"].includes(overlayType)}
  closeDrawer={() => setIsOverlayOpen(false)}
  RenderUI={<CustomNetworkForm formMode="create" onClose={() => setIsOverlayOpen(false)} /* … */ />}
/>
```

Inside the form component, describe fields with a `FormConfiguration` (`src/components/DynamicForm/types.ts`):

| Field key                               | Purpose                                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`, `label`, `subLabel`, `required` | Formik field name and the label column                                                                                                      |
| `type`                                  | `text`, `text-multiline`, `number`, `password`, `select`, `radio`, `single-select-autocomplete`, `multi-select-autocomplete`, `code-editor` |
| `menuItems`, `isLoading`                | Options and loading state for selects                                                                                                       |
| `customComponent`                       | Any other control, for example `CloudProviderRadio` or a `Switch` in a `Tooltip`                                                            |
| `isHidden`, `disabled`                  | Conditional fields; disable fields that cannot change in modify mode                                                                        |
| `previewValue`                          | What the preview card shows; mask secrets (`"********"`)                                                                                    |
| `dataTestId`                            | Test ID for Playwright                                                                                                                      |

Pass `formMode` (`"create"` or `"modify"`), `onClose`, and `isFormSubmitting={createMutation.isPending || updateMutation.isPending}`. `footer.submitButton` holds the button label per mode.

Cancel and reset: MUI unmounts the drawer's content when it closes, so the Formik state is discarded with it. Keep it that way: do not lift form state into the page, and do not set `keepMounted`.

## 3. In-page forms

Settings-style forms use `Form`, `FieldTitle`, a field and `FieldError` in a grid (see `BillingAddressForm.tsx`):

```tsx
<Form onSubmit={formData.handleSubmit}>
  <FieldTitle required>City</FieldTitle>
  <TextField
    name="address.city"
    id="address.city"
    value={values.address.city}
    onChange={handleChange}
    onBlur={handleBlur}
    disabled={isDisabled}
    inputProps={{ "aria-label": "City" }}
  />
  <FieldError>{touched.address?.city && errors.address?.city}</FieldError>

  <Button variant="outlined" onClick={() => formData.resetForm()} disabled={mutation.isPending}>
    Cancel
  </Button>
  <Button type="submit" variant="contained" disabled={mutation.isPending} isLoading={mutation.isPending}>
    Save
  </Button>
</Form>
```

- Cancel calls `formData.resetForm()`. In a dialog that stays mounted, reset and then close: `formData.resetForm(); onClose();` (as `TextConfirmationDialog` does).
- Fields a role may not edit are disabled, not hidden (`BillingAddressForm.tsx` disables the form for non-owners).

## 4. Fields

| Field                   | Component                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text, number, multiline | `TextField` from `src/components/FormElementsv2/TextField/TextField` (`copyButton` adds a copy action)                                                                                        |
| Select                  | `Select` plus `MenuItem` from `src/components/FormElementsv2/`; `isLoading` while options load                                                                                                |
| Password                | `PasswordField` from `src/components/FormElementsv2/PasswordField/PasswordField` (show and hide toggle; `showPasswordGenerator` adds a generator)                                             |
| Autocomplete            | `src/components/FormElementsv2/AutoComplete/AutoComplete`                                                                                                                                     |
| Radio                   | `Radio` and `RadioGroup` from `src/components/FormElementsv2/Radio/Radio`; cloud choice uses `CloudProviderRadio` from `app/(dashboard)/components/CloudProviderRadio/CloudProviderRadio.tsx` |
| Toggle, checkbox        | `src/components/Switch/Switch`, `src/components/Checkbox/Checkbox`                                                                                                                            |
| Label, help, error      | `FieldTitle`, `FieldDescription`, `FieldError` from `src/components/FormElementsv2/`                                                                                                          |

Signed-out pages (`app/(public)/`) use the matching fields in `src/components/NonDashboardComponents/FormElementsV2/`; dashboard forms never do `[no-auth-shell-components]`. Raw `<input>`, `<select>` and `<textarea>` are lint errors outside `src/components/` and root `components/` (`react/forbid-elements`).

Error text appears only after the field is touched: `touched.x && errors.x`. Messages are short and specific ("Name is required", "Please enter a valid URL").

## 5. Submitting and loading

- Submit through an `$api` mutation from `onSubmit`; never from an effect.
- Loading and disabled state come from `mutation.isPending`, not a separate `useState`.
- On success: `snackbar.showSuccess(...)`, invalidate or refetch the list, close the drawer. On failure the global snackbar already shows the error; do not render `error.message`.
- Disable Submit while a required option list is still loading, and say why when it cannot be used (`disabledMessage`).

## 6. Sensitive fields

| Data                                           | Rule                                                                                                                                                                                                                                     |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account passwords                              | `PasswordField` or the `password` field type; set `autoComplete="current-password"` or `"new-password"` (the signup form uses `new-password`); validate with `passwordRegex`; never log, persist or echo the value                       |
| Instance secrets (`password` input parameters) | Rendered with `type: "password"` and a masked `previewValue` (`app/(dashboard)/instances/components/InstanceFormFields.tsx`); keep them out of query keys, URLs and snackbar text                                                        |
| Payment details                                | Card data goes only into Stripe Elements (`PaymentElement` in `app/(dashboard)/payment-methods/components/AddPaymentMethodModal.tsx`). Never build card, bank or tax-ID inputs; show only what the API returns (brand, last four digits) |
| Tokens and one-time codes                      | Never in `localStorage`, `sessionStorage`, Redux, React Query data or URLs you create                                                                                                                                                    |

Form state for secrets lives only as long as the form: no copying into context, Redux or `localStorage`, and nothing restored after navigation.

## 7. Checklist

- [ ] `useFormik` with a Yup `validationSchema` stored next to the form; values typed from `src/types/`.
- [ ] Drawer forms use `FullScreenDrawer` plus `GridDynamicForm`; in-page forms use `Form`, `FieldTitle`, the field and `FieldError`.
- [ ] Cancel discards edits (`resetForm()`, or unmount on close).
- [ ] Submit is disabled and shows a spinner from `mutation.isPending`.
- [ ] Every field has a `dataTestId` or `data-testid` for Playwright.
- [ ] Secrets are masked in previews and never persisted, logged or shown in messages.

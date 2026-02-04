import { ReactElement } from "react";

import { FormMode } from "src/types/common/enums";

export type Field = {
  label: string;
  subLabel: string | React.ReactNode;
  name: string;
  type?: string;
  description?: React.ReactNode;
  required?: boolean;
  isHidden?: boolean;
  disabled?: boolean;
  dataTestId?: string;

  // For Menu Items in Select Field
  menuItems?: any[];
  isLoading?: boolean;
  emptyMenuText?: string;

  // Radio Buttons
  options?: any[];

  // Text Field
  placeholder?: string;

  // Password Field
  showPasswordGenerator?: boolean;

  // Generic
  value?: any;
  previewValue?: ((props: { field: Field; formData: any }) => ReactElement | null) | string | null;
  customComponent?: React.ReactNode;
  onChange?: (e: any) => void;
  onBlur?: (e: any) => void;
};

export type Section = {
  title: string;
  fields: Field[];
};

export type FormConfiguration = {
  dataTestId?: string;
  sections: Section[];
  footer: {
    submitButton: Partial<Record<FormMode, string>>;
  };
};

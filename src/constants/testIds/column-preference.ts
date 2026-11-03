export const columnPreferenceTestIds = {
  button: (tableId: string) => `column-preference-button-${tableId}`,
  popover: "column-preference-popover",
  row: (columnId: string) => `column-preference-row-${columnId}`,
  handle: (columnId: string) => `column-preference-handle-${columnId}`,
  switch: (columnId: string) => `column-preference-switch-${columnId}`,
  reset: "column-preference-reset",
  cancel: "column-preference-cancel",
  confirm: "column-preference-confirm",
  customized: "column-preference-customized",
} as const;

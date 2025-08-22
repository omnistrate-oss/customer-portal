import { menuClasses, SxProps } from "@mui/material";

import LoadingSpinnerSmall from "src/components/CircularProgress/CircularProgress";
import MenuItem from "src/components/FormElementsv2/MenuItem/MenuItem";
import Select from "src/components/FormElementsv2/Select/Select";
import Tooltip from "src/components/Tooltip/Tooltip";
import { colors } from "src/themeConfig";

export type ActionMenuItem = {
  icon?: React.FC<{ disabled?: boolean }>;
  label: string;
  onClick: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  disabledMessage?: string;
  dataTestId?: string;
};

type ActionMenuProps = {
  disabled?: boolean;
  menuItems: ActionMenuItem[];
  sx?: SxProps;
};

const ActionMenu: React.FC<ActionMenuProps> = ({ menuItems, disabled, sx }) => {
  return (
    <Select
      data-testid="actions-select"
      value=""
      renderValue={(value: string) => {
        if (!value) {
          return "Actions";
        } else {
          return "";
        }
      }}
      displayEmpty
      disabled={disabled}
      MenuProps={{
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
        transformOrigin: { vertical: "top", horizontal: "right" },
        sx: {
          marginTop: "8px",
          [`& .${menuClasses.list}`]: {
            padding: "4px 0px",
          },
          [`& .${menuClasses.paper}`]: {
            border: `1px solid ${colors.gray200}`,
            boxShadow: "0px 2px 2px -1px #0A0D120A, 0px 4px 6px -2px #0A0D1208, 0px 12px 16px -4px #0A0D1214",
            borderRadius: "8px",
            maxHeight: "300px",
            "&::-webkit-scrollbar": {
              display: "none",
            },
          },
        },
      }}
      sx={{
        margin: "0px",
        height: "40px",
        minWidth: "110px",
        "&.Mui-focused": {
          outline: `2px solid ${colors.success500}`,
          outlineOffset: "2px",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          border: "1px solid #D0D5DD",
        },
        "& .MuiOutlinedInput-input": {
          fontSize: "14px",
          lineHeight: "20px",
          color: "#414651",
          fontWeight: 600,
        },
        ...sx,
      }}
    >
      {menuItems.map(({ icon: Icon, label, onClick, dataTestId, isLoading, isDisabled, disabledMessage }) => {
        const menuItem = (
          <MenuItem
            data-testid={dataTestId}
            value={label}
            key={label}
            sx={{
              gap: "10px",
              fontSize: "14px",
              color: isDisabled ? "#a4a7ae" : "",
              minWidth: "160px",
              padding: "8px 12px",
              mx: "4px",
            }}
            disabled={isDisabled}
            onClick={onClick}
          >
            {Icon && <Icon disabled={isDisabled} />}
            {label}
            {isLoading && <LoadingSpinnerSmall />}
          </MenuItem>
        );

        if (isDisabled && disabledMessage) {
          return (
            <Tooltip key={label} title={disabledMessage} placement="top">
              <span>{menuItem}</span>
            </Tooltip>
          );
        }

        return menuItem;
      })}
    </Select>
  );
};

export default ActionMenu;

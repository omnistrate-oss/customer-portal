import { Box, Stack } from "@mui/material";

import { Text } from "src/components/Typography/Typography";
import { SetState } from "src/types/common/reactGenerics";

type LeftMenuOption = {
  filterKey: string;
  label: string;
  count?: number;
};

type LeftMenuProps = {
  options: LeftMenuOption[];
  activeFilterView: string;
  setActiveFilterView: SetState<string>;
};

const activeStyles = {
  bgcolor: "#FAFAFA",
  "& .left-menu-label": { color: "#414651" },
};

const LeftMenuItem = ({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count?: number;
  isActive: boolean;
  onClick?: () => void;
}) => {
  return (
    <Box
      p="8px 12px"
      borderRadius="6px"
      onClick={onClick || (() => {})}
      sx={{
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        transition: "background-color 0.15s ease",
        ...(isActive && activeStyles),
        "&:hover": activeStyles,
      }}
    >
      <Text
        className="left-menu-label"
        size="small"
        weight="semibold"
        color="#717680"
        ellipsis
        sx={{ transition: "color 0.15s ease" }}
      >
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <span
          style={{
            border: "1px solid #E9EAEB",
            borderRadius: "100px",
            padding: "2px 8px",
            marginLeft: "8px",
            fontSize: "12px",
            fontWeight: 500,
            color: "#414651",
            flexShrink: 0,
          }}
        >
          {count}
        </span>
      )}
    </Box>
  );
};

const LeftMenu: React.FC<LeftMenuProps> = ({ options, activeFilterView, setActiveFilterView }) => {
  return (
    <Stack gap="4px">
      {options.map((option, index) => (
        <LeftMenuItem
          key={index}
          label={option.label}
          count={option.count}
          isActive={activeFilterView === option.filterKey}
          onClick={() => setActiveFilterView(option.filterKey)}
        />
      ))}
    </Stack>
  );
};

export default LeftMenu;

import { FC } from "react";
import { SelectChangeEvent, Stack, styled } from "@mui/material";
import MuiMenuItem, { menuItemClasses } from "@mui/material/MenuItem";

import Checkbox from "src/components/Checkbox/Checkbox";
import EventTypeChip from "src/components/EventsTable/EventTypeChip";
import Select from "src/components/FormElementsv2/Select/Select";
import { SetState } from "src/types/common/reactGenerics";
import { EventType } from "src/types/event";
import { Text } from "src/components/Typography/Typography";
import Chip from "src/components/Chip/Chip";

const MenuItem = styled(MuiMenuItem)({
  borderRadius: 6,
  padding: "10px 14px",
  fontSize: "16px",
  fontWeight: 500,
  lineHeight: "24px",
  color: "#101828",
  backgroundColor: "white",
  "&+&": {
    marginTop: "0px",
  },
  [`&.${menuItemClasses.selected}`]: {
    backgroundColor: "white",
  },
  [`&.${menuItemClasses.focusVisible}`]: {
    backgroundColor: "white",
  },
});

type DropdownProps = {
  selectedEventTypes: string[];
  setSelectedEventTypes: SetState<string[]>;
  filterEventTypes?: EventType[];
};

const AuditLogsEventFilterDropdown: FC<DropdownProps> = (props) => {
  const { selectedEventTypes, setSelectedEventTypes, filterEventTypes = ["Customer", "Infra", "Maintenance"] } = props;

  const handleChange = (event: SelectChangeEvent<string>) => {
    const {
      target: { value },
    } = event;
    setSelectedEventTypes(
      // On autofill we get a stringified value.
      typeof value === "string" ? value.split(",") : value
    );
  };

  return (
    <Select
      multiple
      value={selectedEventTypes}
      renderValue={() => {
        return (
          <Stack direction="row" gap="8px" alignItems="center">
            {selectedEventTypes.length > 0 && <Chip size="small" label={selectedEventTypes.length} />}
            <Text size="small" weight="medium" color="#344054">
              Filter by Type
            </Text>
          </Stack>
        );
      }}
      sx={{
        width: "auto",
        marginTop: 0,
        minWidth: "auto",
        minHeight: "40px",
        height: "40px !important",
        "& .MuiSelect-select": {
          fontSize: "14px",
          color: "#414651",
          fontWeight: "500",
        },
      }}
      onChange={handleChange}
      displayEmpty
      fullWidth={false}
    >
      {filterEventTypes.map((eventType) => {
        return (
          <MenuItem key={eventType} value={eventType}>
            <Checkbox
              //@ts-ignore
              sx={{ padding: "0px", marginRight: "8px" }}
              checked={selectedEventTypes.indexOf(eventType) > -1}
            />{" "}
            <EventTypeChip eventType={eventType} />
          </MenuItem>
        );
      })}
    </Select>
  );
};

export default AuditLogsEventFilterDropdown;

import { FC, MouseEvent, useState } from "react";
import { DragDropContext, Draggable, DraggableProvidedDragHandleProps, Droppable, DropResult } from "@hello-pangea/dnd";
import { Box, IconButton, Stack } from "@mui/material";

import Button from "src/components/Button/Button";
import Dot from "src/components/Dot/Dot";
import ColumnsIcon from "src/components/Icons/Columns/ColumnsIcon";
import DragHandleIcon from "src/components/Icons/DragHandle/DragHandleIcon";
import Popover from "src/components/Popover/Popover";
import Switch from "src/components/Switch/Switch";
import Tooltip from "src/components/Tooltip/Tooltip";
import { Text } from "src/components/Typography/Typography";
import { columnPreferenceTestIds } from "src/constants/testIds/column-preference";
import { colors } from "src/themeConfig";

import { ColumnKind, ColumnLayout, moveItem, toStoredColumnLayout } from "./columnLayout";
import { ColumnPreferenceTableId } from "./tableIds";

export const COLUMN_PREFERENCE_LABEL = "Column Preference";

const PRIMARY_COLUMN_REASON = "This column opens the row, so it stays in place and is always shown";
const PRIMARY_COLUMN_MOVE_REASON = "This column opens the row, so its order can't be changed";
const LOCKED_COLUMN_REASON = "This column has links or actions, so it can't be hidden";
const LAST_VISIBLE_COLUMN_REASON = "At least one column must be shown";
const DRAGGING_SHADOW = "0px 1px 2px 0px rgba(10, 13, 18, 0.05)";

export type ColumnPreferenceItem = { id: string; label: string; kind: Exclude<ColumnKind, "utility"> };

export type ColumnPreferenceButtonProps = {
  tableId: ColumnPreferenceTableId;
  /** The listed columns, in their default order. */
  items: ColumnPreferenceItem[];
  /** The layout the grid shows now. */
  layout: ColumnLayout;
  defaultLayout: ColumnLayout;
  onSave: (layout: ColumnLayout) => void;
  /** True until the signed-in user is known. */
  disabled?: boolean;
};

type ColumnRowProps = {
  item: ColumnPreferenceItem;
  isShown: boolean;
  disabledMessage?: string;
  onToggle?: () => void;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
};

const ColumnRow: FC<ColumnRowProps> = ({ item, isShown, disabledMessage, onToggle, dragHandleProps }) => (
  <Stack
    direction="row"
    alignItems="center"
    gap="12px"
    px="16px"
    py="10px"
    data-testid={columnPreferenceTestIds.row(item.id)}
  >
    {dragHandleProps ? (
      <Box
        {...dragHandleProps}
        aria-label={`Reorder ${item.label}`}
        data-testid={columnPreferenceTestIds.handle(item.id)}
        sx={{
          display: "flex",
          color: colors.gray400,
          cursor: "grab",
          borderRadius: "4px",
          "&:focus-visible": { outline: (theme) => `2px solid ${theme.palette.primary.main}` },
        }}
      >
        <DragHandleIcon />
      </Box>
    ) : (
      <Tooltip title={PRIMARY_COLUMN_MOVE_REASON}>
        <Box display="flex" color={colors.gray300} sx={{ cursor: "not-allowed" }}>
          <DragHandleIcon />
        </Box>
      </Tooltip>
    )}
    <Text size="small" weight="medium" color={colors.gray700} ellipsis sx={{ flex: 1, minWidth: 0 }}>
      {item.label}
    </Text>
    <Switch
      checked={isShown}
      disabled={!!disabledMessage}
      disabledMessage={disabledMessage}
      onChange={onToggle}
      inputProps={{ "aria-label": `Show ${item.label}`, "data-testid": columnPreferenceTestIds.switch(item.id) }}
    />
  </Stack>
);

/** The Column Preference button and popover. Get its props from `useGridColumnPreference` or `useTableColumnPreference`. */
const ColumnPreferenceButton: FC<ColumnPreferenceButtonProps> = ({
  tableId,
  items,
  layout,
  defaultLayout,
  onSave,
  disabled = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [draft, setDraft] = useState<ColumnLayout>(layout);

  const itemById = new Map(items.map((item) => [item.id, item]));
  const primaryItems = items.filter((item) => item.kind === "primary");
  const movableItems = draft.order.flatMap((id) => {
    const item = itemById.get(id);
    return item ? [item] : [];
  });
  const movableIds = movableItems.map((item) => item.id);
  const hiddenIds = new Set(draft.hidden);
  const hasAlwaysShownColumn = items.some((item) => item.kind !== "optional");
  const shownCount = items.filter((item) => !hiddenIds.has(item.id)).length;
  const isCustomized = toStoredColumnLayout(layout, defaultLayout, null) !== null;
  const triggerLabel = isCustomized ? `${COLUMN_PREFERENCE_LABEL} (customized)` : COLUMN_PREFERENCE_LABEL;

  const getDisabledMessage = (item: ColumnPreferenceItem): string | undefined => {
    if (item.kind === "locked") return LOCKED_COLUMN_REASON;
    if (!hasAlwaysShownColumn && shownCount === 1 && !hiddenIds.has(item.id)) return LAST_VISIBLE_COLUMN_REASON;
    return undefined;
  };

  const openPopover = (event: MouseEvent<HTMLButtonElement>) => {
    setDraft(layout);
    setAnchorEl(event.currentTarget);
  };

  const closePopover = () => setAnchorEl(null);

  const toggleColumn = (id: string) =>
    setDraft((current) => ({
      ...current,
      hidden: current.hidden.includes(id)
        ? current.hidden.filter((hiddenId) => hiddenId !== id)
        : [...current.hidden, id],
    }));

  const handleDragEnd = ({ source, destination }: DropResult) => {
    if (!destination) return;
    setDraft((current) => ({ ...current, order: moveItem(movableIds, source.index, destination.index) }));
  };

  const handleConfirm = () => {
    onSave({ order: movableIds, hidden: draft.hidden.filter((id) => itemById.get(id)?.kind === "optional") });
    closePopover();
  };

  return (
    <>
      <Tooltip title={disabled ? "Loading your column preferences" : triggerLabel}>
        <Box component="span" sx={{ display: "inline-flex", alignSelf: "center" }}>
          <IconButton
            size="small"
            onClick={openPopover}
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={!!anchorEl}
            aria-label={triggerLabel}
            data-testid={columnPreferenceTestIds.button(tableId)}
            sx={{ color: colors.gray600 }}
          >
            <ColumnsIcon />
            {!!isCustomized && (
              <Dot
                size={8}
                color={colors.success600}
                data-testid={columnPreferenceTestIds.customized}
                sx={{ position: "absolute", top: "3px", right: "3px" }}
              />
            )}
          </IconButton>
        </Box>
      </Tooltip>

      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={(event, reason) => {
          // Escape while dragging with the keyboard cancels the drag (pangea marks it handled); keep the popover open.
          if (reason === "escapeKeyDown" && "defaultPrevented" in event && event.defaultPrevented) return;
          closePopover();
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            role: "dialog",
            "aria-label": COLUMN_PREFERENCE_LABEL,
            sx: { mt: "8px", width: "360px", maxWidth: "calc(100vw - 32px)", overflow: "hidden" },
          },
        }}
      >
        <Box data-testid={columnPreferenceTestIds.popover}>
          <Box pt="6px">
            <Box sx={{ overflowY: "hidden", scrollbarGutter: "stable" }}>
              {primaryItems.map((item) => (
                <ColumnRow key={item.id} item={item} isShown disabledMessage={PRIMARY_COLUMN_REASON} />
              ))}
            </Box>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId={`column-preference-${tableId}`}>
                {(droppableProvided) => (
                  <Box
                    ref={droppableProvided.innerRef}
                    {...droppableProvided.droppableProps}
                    sx={{ maxHeight: "min(360px, calc(100vh - 240px))", overflowY: "auto", scrollbarGutter: "stable" }}
                  >
                    {movableItems.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(draggableProvided, snapshot) => (
                          <Box
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            sx={{ bgcolor: colors.white, boxShadow: snapshot.isDragging ? DRAGGING_SHADOW : "none" }}
                          >
                            <ColumnRow
                              item={item}
                              isShown={!hiddenIds.has(item.id)}
                              disabledMessage={getDisabledMessage(item)}
                              onToggle={() => toggleColumn(item.id)}
                              dragHandleProps={draggableProvided.dragHandleProps}
                            />
                          </Box>
                        )}
                      </Draggable>
                    ))}
                    {droppableProvided.placeholder}
                  </Box>
                )}
              </Droppable>
            </DragDropContext>
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap="8px"
            px="16px"
            py="12px"
            mt="6px"
            borderTop={1}
            borderColor={colors.gray200}
          >
            <Button variant="text" onClick={() => setDraft(defaultLayout)} data-testid={columnPreferenceTestIds.reset}>
              Reset to default
            </Button>
            <Stack direction="row" gap="8px">
              <Button variant="outlined" onClick={closePopover} data-testid={columnPreferenceTestIds.cancel}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleConfirm} data-testid={columnPreferenceTestIds.confirm}>
                Apply
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Popover>
    </>
  );
};

export default ColumnPreferenceButton;

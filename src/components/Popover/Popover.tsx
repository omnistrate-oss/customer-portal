import { useCallback, useRef } from "react";
import { Popover as MuiPopover, popoverClasses, PopoverProps, styled } from "@mui/material";

import { themeConfig } from "src/themeConfig";

const Popover = styled(MuiPopover)({
  [`& .${popoverClasses.paper}`]: {
    border: `1px solid ${themeConfig.colors.gray200}`,
    boxShadow: "0px 2px 2px -1px #0A0D120A, 0px 4px 6px -2px #0A0D1208, 0px 12px 16px -4px #0A0D1214",
    borderRadius: "8px",
  },
});

export default Popover;

// use this for popover with dynamic height to prevent popover overflow when height changes after popover is opended
//it will resposition the popover not to overflow when the popover overflows
export const PopoverDynamicHeight = (props: PopoverProps) => {
  const popoverRef = useRef<HTMLDivElement | null>(null); // Ref for ResizeObserver

  // Function to observe popover height & reposition
  const observePopoverHeight = () => {
    if (!popoverRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize")); // Force Popper.js update
      }, 0);
    });

    resizeObserver.observe(popoverRef.current);
  };

  // Callback ref to capture latest rendered popover node
  const setPopoverRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      popoverRef.current = node;
      observePopoverHeight(); // Attach observer when ref is set
    }
  }, []);

  return (
    <Popover
      slotProps={{
        paper: {
          ref: setPopoverRef, // Attach ref dynamically using callback
        },
      }}
      {...props}
    />
  );
};

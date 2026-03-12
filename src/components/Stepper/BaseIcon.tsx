import { Stack } from "@mui/material";
import { useId } from "react";

const BaseIcon = (props) => {
  const clipPathId = useId();

  return (
    <Stack justifyContent="center" alignItems="center" width={32} height={32}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={32}
        height={32}
        viewBox="0 0 25 24"
        fill="none"
        style={{ zIndex: 99 }}
        {...props}
      >
        <g clipPath={`url(#${clipPathId})`}>
          <path fill="#FAFAFA" d="M.5 12c0-6.627 5.373-12 12-12s12 5.373 12 12-5.373 12-12 12-12-5.373-12-12Z" />
          <path
            stroke="#E9EAEB"
            strokeWidth={1.5}
            d="M12.5.75C18.713.75 23.75 5.787 23.75 12S18.713 23.25 12.5 23.25 1.25 18.213 1.25 12 6.287.75 12.5.75Z"
          />
          <circle cx={12.5} cy={12} r={4} fill="#D5D7DA" />
        </g>
        <defs>
          <clipPath id={clipPathId}>
            <path fill="#fff" d="M.5 12c0-6.627 5.373-12 12-12s12 5.373 12 12-5.373 12-12 12-12-5.373-12-12Z" />
          </clipPath>
        </defs>
      </svg>
    </Stack>
  );
};
export default BaseIcon;

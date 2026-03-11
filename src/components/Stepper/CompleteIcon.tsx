import { Stack } from "@mui/material";
import { useId } from "react";

import { styleConfig } from "src/providerConfig";

const CompleteIcon = (props) => {
  const clipPathId = useId();

  return (
    <Stack justifyContent="center" alignItems="center" width={28} height={28}>
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
          <path fill="#F9F5FF" d="M.5 12c0-6.627 5.373-12 12-12s12 5.373 12 12-5.373 12-12 12-12-5.373-12-12Z" />
          <path
            fill={styleConfig.primaryButtonBg}
            d="M.5 12c0-6.627 5.373-12 12-12s12 5.373 12 12-5.373 12-12 12-12-5.373-12-12Z"
          />
          <path
            fill="#fff"
            fillRule="evenodd"
            d="m17.596 7.39-7.16 6.91-1.9-2.03c-.35-.33-.9-.35-1.3-.07-.39.29-.5.8-.26 1.21l2.25 3.66c.22.34.6.55 1.03.55.41 0 .8-.21 1.02-.55.36-.47 7.23-8.66 7.23-8.66.9-.92-.19-1.73-.91-1.03v.01Z"
            clipRule="evenodd"
          />
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
export default CompleteIcon;

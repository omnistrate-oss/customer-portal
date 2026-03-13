import { useId } from "react";

import { styleConfig } from "src/providerConfig";
import { colors } from "src/themeConfig";

const ClockIcon = ({ disabled }: { disabled?: boolean }) => {
  const clipPathId = useId();
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath={`url(#${clipPathId})`}>
        <path
          d="M9.99984 5.00008V10.0001L13.3332 11.6667M18.3332 10.0001C18.3332 14.6025 14.6022 18.3334 9.99984 18.3334C5.39746 18.3334 1.6665 14.6025 1.6665 10.0001C1.6665 5.39771 5.39746 1.66675 9.99984 1.66675C14.6022 1.66675 18.3332 5.39771 18.3332 10.0001Z"
          stroke={disabled ? styleConfig.sidebarIconDisabledColor : colors.gray400}
          strokeWidth="1.66667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default ClockIcon;

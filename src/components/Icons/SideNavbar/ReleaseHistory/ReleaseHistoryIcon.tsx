import type { FC } from "react";

import { styleConfig } from "src/providerConfig";
import { SVGIconProps } from "src/types/common/generalTypes";
const ReleaseHistoryIcon: FC<SVGIconProps> = (props) => {
  const { disabled, ...restProps } = props;
  let color = props.color || styleConfig.sidebarIconColor;

  if (disabled) {
    color = styleConfig.sidebarIconDisabledColor;
  }

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...restProps}>
      <path
        d="M17.5 9.99999L7.5 9.99999M17.5 4.99999L7.5 4.99999M17.5 15L7.5 15M4.16667 9.99999C4.16667 10.4602 3.79357 10.8333 3.33333 10.8333C2.8731 10.8333 2.5 10.4602 2.5 9.99999C2.5 9.53975 2.8731 9.16666 3.33333 9.16666C3.79357 9.16666 4.16667 9.53975 4.16667 9.99999ZM4.16667 4.99999C4.16667 5.46023 3.79357 5.83332 3.33333 5.83332C2.8731 5.83332 2.5 5.46023 2.5 4.99999C2.5 4.53975 2.8731 4.16666 3.33333 4.16666C3.79357 4.16666 4.16667 4.53975 4.16667 4.99999ZM4.16667 15C4.16667 15.4602 3.79357 15.8333 3.33333 15.8333C2.8731 15.8333 2.5 15.4602 2.5 15C2.5 14.5398 2.8731 14.1667 3.33333 14.1667C3.79357 14.1667 4.16667 14.5398 4.16667 15Z"
        stroke={color}
        strokeWidth="2.004"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ReleaseHistoryIcon;

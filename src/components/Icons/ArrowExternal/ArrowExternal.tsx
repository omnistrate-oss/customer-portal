import { FC } from "react";

import { SVGIconProps } from "src/types/common/generalTypes";

const ExternalArrowIcon: FC<SVGIconProps> = ({ color = "#7F56D9", ...otherProps }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="none" {...otherProps}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="m4 12 8-8m0 0H6.667M12 4v5.333"
      />
    </svg>
  );
};
export default ExternalArrowIcon;

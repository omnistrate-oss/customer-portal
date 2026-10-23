import { FC } from "react";

import { SVGIconProps } from "src/types/common/generalTypes";

const DragHandleIcon: FC<SVGIconProps> = ({ color = "currentColor", ...props }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
    <circle cx="7.5" cy="5" r="1.5" fill={color} />
    <circle cx="12.5" cy="5" r="1.5" fill={color} />
    <circle cx="7.5" cy="10" r="1.5" fill={color} />
    <circle cx="12.5" cy="10" r="1.5" fill={color} />
    <circle cx="7.5" cy="15" r="1.5" fill={color} />
    <circle cx="12.5" cy="15" r="1.5" fill={color} />
  </svg>
);

export default DragHandleIcon;

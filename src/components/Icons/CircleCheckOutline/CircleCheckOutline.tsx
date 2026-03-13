import { FC, useId } from "react";

import { SVGIconProps } from "src/types/common/generalTypes";

const CircleCheckOutlineIcon: FC<SVGIconProps> = (props) => {
  const clipPathId = useId();
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} fill="none" {...props}>
      <g clipPath={`url(#${clipPathId})`}>
        <path
          stroke="#17B26A"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="m3.75 6 1.5 1.5 3-3M11 6A5 5 0 1 1 1 6a5 5 0 0 1 10 0Z"
        />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <path fill="#fff" d="M0 0h12v12H0z" />
        </clipPath>
      </defs>
    </svg>
  );
};
export default CircleCheckOutlineIcon;

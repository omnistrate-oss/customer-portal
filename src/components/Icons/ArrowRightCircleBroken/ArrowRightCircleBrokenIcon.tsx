import { FC, useId } from "react";

import { SVGIconProps } from "src/types/common/generalTypes";

const ArrowRightCircleBrokenIcon: FC<SVGIconProps> = (props) => {
  const { disabled, color = "#7F56D9", ...restProps } = props;
  const clipPathId = useId();

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="none" {...restProps}>
      <g clipPath={`url(#${clipPathId})`}>
        <path
          stroke={disabled ? "#a3a6ac" : color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M2.225 11.333a6.667 6.667 0 1 0 0-6.667M8 5.334 10.667 8m0 0L8 10.667M10.667 8H1.333"
        />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <path fill="#fff" d="M16 0H0v16h16z" />
        </clipPath>
      </defs>
    </svg>
  );
};
export default ArrowRightCircleBrokenIcon;

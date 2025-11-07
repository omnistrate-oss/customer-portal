import { FC } from "react";

import { SVGIconProps } from "src/types/common/generalTypes";

const FilterLinesIcon: FC<SVGIconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="none" {...props}>
    <path
      stroke={props.color ?? "#414651"}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.667}
      d="M5 10h10M2.5 5h15m-10 10h5"
    />
  </svg>
);
export default FilterLinesIcon;

import { FC, useId } from "react";

import { SVGIconProps } from "src/types/common/generalTypes";

const AmazonCognitoIcon: FC<SVGIconProps> = (props) => {
  const { width = 24, height = 24 } = props;
  const clipPathId = useId();

  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g clipPath={`url(#${clipPathId})`}>
        <path
          fill="#7A3E65"
          d="m17.124 4.662 2.114-.533.016.023.053 12.488-.069.067-.436.019-1.653-.252-.025-.064V4.662ZM4.897 17.575h.008l5.58 1.587.015.01.024.02-.008 4.753-.016.02-5.603-2.663v-3.727Z"
        />
        <path
          fill="#CFB2C1"
          d="m17.124 16.41-6.615 1.55-3.321-.784-2.29.399 5.602 1.598 8.646-2.29.092-.175-2.114-.298Z"
        />
        <path
          fill="#512843"
          d="m16.102 6.393-.054-.06-5.488-1.56-.06.022-.055-.027-8.636 2.436-.047.056.069.037 1.975.284.07-.024 6.615-1.55 3.321.785 2.29-.4Z"
        />
        <path fill="#C17B9E" d="m3.876 19.306-2.114.499-.004-.012-.083-12.44.087-.093 2.114.298v11.748Z" />
        <path fill="#7A3E65" d="m6.73 14.48 3.77.433.028-.042.016-5.769-.044-.047-3.77.433v4.992Z" />
        <path
          fill="#C17B9E"
          d="m14.27 14.48-3.77.433V9.055l3.77.433v4.992Zm1.832-8.087L10.5 4.795V.003l5.602 2.662v3.728Z"
        />
        <path fill="#7A3E65" d="M10.5.003 0 4.962v14.044l1.762.799V7.26L10.5 4.795V.003Z" />
        <path fill="#C17B9E" d="M19.238 4.13v12.577L10.5 19.172v4.793L21 19.006V4.961l-1.762-.832Z" />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <path fill="#fff" d="M0 0h21v24H0z" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default AmazonCognitoIcon;

import { FC, useId } from "react";

import { SVGIconProps } from "src/types/common/generalTypes";

const ErrorIcon: FC<SVGIconProps> = (props) => {
  const filterId = useId();
  const clipPathId = useId();
  return (
    <svg
      width={32}
      height={33}
      viewBox="0 0 32 33"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ zIndex: 99 }}
      {...props}
    >
      <g filter={`url(#${filterId})`}>
        <g clipPath={`url(#${clipPathId})`}>
          <rect x={4} y={4.95332} width={24} height={24} rx={12} fill="#FEF3F2" />
          <rect x={4.75} y={5.70332} width={22.5} height={22.5} rx={11.25} fill="#FEF3F2" />
          <rect x={4.75} y={5.70332} width={22.5} height={22.5} rx={11.25} stroke="#F04438" strokeWidth={1.5} />
          <path
            d="M19.3333 13.6667L12.6666 20.3333M12.6666 13.6667L19.3333 20.3333"
            stroke="#D92D20"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
      <defs>
        <filter
          id={filterId}
          x={0}
          y={0.953323}
          width={32}
          height={32}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology radius={4} operator="dilate" in="SourceAlpha" result="effect1_dropShadow_975_1065" />
          <feOffset />
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.959216 0 0 0 0 0.921569 0 0 0 1 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_975_1065" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_975_1065" result="shape" />
        </filter>
        <clipPath id={clipPathId}>
          <rect x={4} y={4.95332} width={24} height={24} rx={12} fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};
export default ErrorIcon;

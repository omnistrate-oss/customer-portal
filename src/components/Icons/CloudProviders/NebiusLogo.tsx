import { FC, useId } from "react";

import { SVGIconProps } from "src/types/common/generalTypes";

const NebiusIcon: FC<SVGIconProps> = (props) => {
  const clipId = useId();
  return (
    <svg width="20" height="20" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g clipPath={`url(#${clipId})`}>
        <rect width="80" height="80" rx="16" fill="#E0FF4F" />
        <path
          d="M24.5 18C28.5 18 31 20 32.5 23L42.5 46C44.5 50.5 48.5 50 48.5 50C48.5 53 46 56 43 56C40 56 37.5 54 36 51L26 27.5C23.5 22 19.5 23 19.5 23V56H12V32C12 23 19.5 23 19.5 23C19.5 20 21.5 18 24.5 18Z"
          fill="#052B42"
        />
        <path
          d="M48.5 50C48.5 54.5 45.5 56 45.5 56V23H53V47C53 56 45.5 56 45.5 56C45.5 53 48.5 50 48.5 50Z"
          fill="#052B42"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="80" height="80" rx="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default NebiusIcon;

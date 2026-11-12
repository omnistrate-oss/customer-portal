import { FC } from "react";

import { SVGIconProps } from "src/types/common/generalTypes";

type FullscreenIconProps = SVGIconProps & { minimize?: boolean };

const FullscreenIcon: FC<FullscreenIconProps> = ({ minimize = false, color = "currentColor", ...props }) => (
  <svg width={20} height={20} viewBox="0 0 20 20" fill="none" aria-hidden {...props}>
    <path
      d={minimize ? "M3 7h4V3m6 0v4h4M17 13h-4v4m-6 0v-4H3" : "M7 3H3v4m10-4h4v4m0 6v4h-4m-6 0H3v-4"}
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default FullscreenIcon;

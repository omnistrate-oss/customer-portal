import { FC } from "react";

import { styleConfig } from "src/providerConfig";
import { SVGIconProps } from "src/types/common/generalTypes";

const UnlockIcon: FC<SVGIconProps> = (props) => {
  const { disabled, color = "#717680" } = props;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={16} height={16} fill="none" {...props}>
      <path
        stroke={disabled ? styleConfig.sidebarIconDisabledColor : color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4.667 7.333v-2a3.333 3.333 0 0 1 6.6-.666M5.2 14h5.6c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874C14 12.48 14 11.92 14 10.8v-.267c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874c-.428-.218-.988-.218-2.108-.218H5.2c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C2 8.853 2 9.413 2 10.533v.267c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C3.52 14 4.08 14 5.2 14Z"
      />
    </svg>
  );
};

export default UnlockIcon;

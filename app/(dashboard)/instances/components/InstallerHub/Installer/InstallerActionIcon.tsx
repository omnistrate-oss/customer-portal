import { FC } from "react";

import { SVGIconProps } from "src/types/common/generalTypes";

const InstallerActionIcon: FC<SVGIconProps> = (props) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} fill="none" {...props}>
      <path
        stroke={props.color || "#000"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14 11H8m2 4H8m8-8H8m12-.2v10.4c0 1.68 0 2.52-.327 3.162a3 3 0 0 1-1.311 1.311C17.72 22 16.88 22 15.2 22H8.8c-1.68 0-2.52 0-3.162-.327a3 3 0 0 1-1.311-1.311C4 19.72 4 18.88 4 17.2V6.8c0-1.68 0-2.52.327-3.162a3 3 0 0 1 1.311-1.311C6.28 2 7.12 2 8.8 2h6.4c1.68 0 2.52 0 3.162.327a3 3 0 0 1 1.311 1.311C20 4.28 20 5.12 20 6.8Z"
      />
    </svg>
  );
};

export default InstallerActionIcon;

import { FC } from "react";

import { SVGIconProps } from "src/types/common/generalTypes";

const DeleteProtectionIcon: FC<SVGIconProps> = (props) => {
  const { disabled } = props;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="none" {...props}>
      <g clipPath="url(#a)">
        <path
          fill={disabled ? "#717680" : "#D92D20"}
          d="m9.442 11.687.771.771A1.616 1.616 0 0 1 9.01 13H3.97c-.83 0-1.524-.621-1.615-1.446l-.87-7.824 1.227 1.226.72 6.479c.03.274.262.482.538.482h5.04c.18 0 .333-.094.432-.23Zm3.535.524-.766.766L.023.789.79.023l2.144 2.144h.859V1.083C3.792.486 4.278 0 4.875 0h3.25c.597 0 1.083.486 1.083 1.083v1.084h3.25V3.25h-.91l-.754 6.778 2.183 2.183ZM4.875 2.167h3.25V1.083h-3.25v1.084Zm-.86 1.083 5.798 5.797.644-5.797H4.016Z"
        />
      </g>
      <defs>
        <clipPath id="a">
          <path fill="#fff" d="M0 0h13v13H0z" />
        </clipPath>
      </defs>
    </svg>
  );
};
export default DeleteProtectionIcon;
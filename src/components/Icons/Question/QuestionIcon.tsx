import { FC, useId } from "react";

import { colors } from "src/themeConfig";
import { SVGIconProps } from "src/types/common/generalTypes";

const QuestionIcon: FC<SVGIconProps> = (props) => {
  const { color = "#D0D1D3", disabled, ...restProps } = props;
  const clipPathIdA = useId();
  const clipPathIdB = useId();

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} fill="none" {...restProps}>
      <g clipPath={`url(#${clipPathIdA})`}>
        <g clipPath={`url(#${clipPathIdB})`}>
          <path
            fill={disabled ? colors.gray400 : color}
            d="M9 0C4.026 0 0 4.025 0 9c0 4.974 4.025 9 9 9 4.974 0 9-4.025 9-9 0-4.974-4.025-9-9-9Zm-.266 13.212a.91.91 0 0 1-.9-.912.91.91 0 0 1 .9-.912.92.92 0 0 1 .912.912.92.92 0 0 1-.912.912Zm1.35-4.608c-.651.51-.663.865-.663 1.48 0 .226-.119.487-.7.487-.485 0-.65-.178-.65-.794 0-1.019.45-1.505.793-1.8.39-.333 1.054-.7 1.054-1.34 0-.544-.474-.805-1.066-.805-1.208 0-.948.912-1.587.912-.32 0-.711-.213-.711-.675 0-.64.734-1.588 2.334-1.588 1.516 0 2.523.842 2.523 1.955 0 1.114-1.007 1.92-1.327 2.168Z"
          />
        </g>
      </g>
      <defs>
        <clipPath id={clipPathIdA}>
          <path fill="#fff" d="M0 0h18v18H0z" />
        </clipPath>
        <clipPath id={clipPathIdB}>
          <path fill="#fff" d="M0 0h18v18H0z" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default QuestionIcon;

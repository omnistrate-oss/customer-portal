import { FC, useId } from "react";

import { SVGIconProps } from "src/types/common/generalTypes";

const BrokenCircleCheckIcon: FC<SVGIconProps> = (props) => {
  const { color = "#039855", disabled, ...restProps } = props;
  const clipPathId = useId();

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...restProps}>
      <g clipPath={`url(#${clipPathId})`}>
        <path
          d="M18.3332 9.23812V10.0048C18.3321 11.8018 17.7503 13.5504 16.6743 14.9896C15.5983 16.4289 14.0859 17.4819 12.3626 17.9914C10.6394 18.5009 8.79755 18.4397 7.1119 17.8169C5.42624 17.1942 3.98705 16.0432 3.00897 14.5357C2.03089 13.0282 1.56633 11.2448 1.68457 9.45172C1.80281 7.65859 2.49751 5.95173 3.66507 4.58568C4.83263 3.21964 6.41049 2.26761 8.16333 1.87158C9.91617 1.47555 11.7501 1.65674 13.3915 2.38812M18.3332 3.33335L9.99984 11.675L7.49984 9.17502"
          stroke={disabled ? "#a3a6ac" : color}
          strokeWidth="1.66667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default BrokenCircleCheckIcon;

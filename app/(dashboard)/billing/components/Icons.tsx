import { FC, useId } from "react";

import { SVGIconProps } from "src/types/common/generalTypes";

export const StripeIcon: FC<SVGIconProps> = (props) => {
  const clipPathId = useId();
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g clipPath={`url(#${clipPathId})`}>
        <path
          d="M31.0218 0H8.97818C4.01967 0 0 4.01967 0 8.97818V31.0218C0 35.9803 4.01967 40 8.97818 40H31.0218C35.9803 40 40 35.9803 40 31.0218V8.97818C40 4.01967 35.9803 0 31.0218 0Z"
          fill="#6772E5"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M18.4275 15.5179C18.4275 14.5619 19.2172 14.1324 20.4919 14.1324C22.6042 14.178 24.677 14.714 26.5466 15.698V10.0312C24.623 9.27687 22.5719 8.90053 20.5058 8.92281C15.5733 8.92281 12.2758 11.4999 12.2758 15.8504C12.2758 22.584 21.531 21.4895 21.531 24.3991C21.531 25.5214 20.5473 25.8816 19.2034 25.8816C16.8358 25.751 14.5308 25.0728 12.4697 23.9003V29.7056C14.5698 30.6131 16.8324 31.0845 19.1202 31.0912C24.1774 31.0912 27.6689 28.5972 27.6689 24.1635C27.7105 16.945 18.4275 18.2474 18.4275 15.5179Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <rect width="40" height="40" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

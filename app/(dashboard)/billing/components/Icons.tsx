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

export const MemoryIcon: FC<SVGIconProps> = (props) => (
  <svg width={18} height={18} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M6.75 6V12M9.75 6V12M12.75 6V12M4.5 3H13.5C13.8978 3 14.2794 3.15804 14.5607 3.43934C14.842 3.72064 15 4.10218 15 4.5V13.5C15 13.8978 14.842 14.2794 14.5607 14.5607C14.2794 14.842 13.8978 15 13.5 15H4.5C4.10218 15 3.72064 14.842 3.43934 14.5607C3.15804 14.2794 3 13.8978 3 13.5V4.5C3 4.10218 3.15804 3.72064 3.43934 3.43934C3.72064 3.15804 4.10218 3 4.5 3Z"
      stroke="#17B26A"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const StorageIcon: FC<SVGIconProps> = (props) => (
  <svg width={18} height={18} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M16.5 9H1.5M1.5 9L4.0875 3.8325C4.21168 3.58259 4.40312 3.37228 4.64028 3.22521C4.87745 3.07814 5.15094 3.00015 5.43 3H12.57C12.8491 3.00015 13.1226 3.07814 13.3597 3.22521C13.5969 3.37228 13.7883 3.58259 13.9125 3.8325L16.5 9V13.5C16.5 13.8978 16.342 14.2794 16.0607 14.5607C15.7794 14.842 15.3978 15 15 15H3C2.60218 15 2.22064 14.842 1.93934 14.5607C1.65804 14.2794 1.5 13.8978 1.5 13.5V9ZM4.5 12H4.5075M7.5 12H7.5075"
      stroke="#17B26A"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ComputeIcon: FC<SVGIconProps> = (props) => {
  const clipPathId = useId();
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g clipPath={`url(#${clipPathId})`}>
        <path
          d="M6.75 0.75V3.75M11.25 0.75V3.75M6.75 14.25V17.25M11.25 14.25V17.25M0.75 6.75H3.75M0.75 11.25H3.75M14.25 6.75H17.25M14.25 11.25H17.25M3.75 3.75H14.25V14.25H3.75V3.75ZM6.75 6.75H11.25V11.25H6.75V6.75Z"
          stroke="#17B26A"
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <rect width={18} height={18} fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const ReplicaIcon: FC<SVGIconProps> = (props) => (
  <svg width={18} height={18} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M12 12V13.5C12 13.8978 11.842 14.2794 11.5607 14.5607C11.2794 14.842 10.8978 15 10.5 15H3C2.60218 15 2.22064 14.842 1.93934 14.5607C1.65804 14.2794 1.5 13.8978 1.5 13.5V6C1.5 5.60218 1.65804 5.22064 1.93934 4.93934C2.22064 4.65804 2.60218 4.5 3 4.5H4.5M4.5 4.5V13.5C4.5 13.8978 4.65804 14.2794 4.93934 14.5607C5.22064 14.842 5.60218 15 6 15H15C15.3978 15 15.7794 14.842 16.0607 14.5607C16.342 14.2794 16.5 13.8978 16.5 13.5V4.5C16.5 4.10218 16.342 3.72064 16.0607 3.43934C15.7794 3.15804 15.3978 3 15 3H6C5.60218 3 5.22064 3.15804 4.93934 3.43934C4.65804 3.72064 4.5 4.10218 4.5 4.5Z"
      stroke="#079455"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

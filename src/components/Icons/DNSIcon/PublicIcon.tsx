import { FC, useId } from "react";

import { SVGIconProps } from "src/types/common/generalTypes";

const PublicIcon: FC<SVGIconProps> = (props) => {
  const filterId = useId();
  const gradientId = useId();
  const clipPathId = useId();
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g filter={`url(#${filterId})`}>
        <path
          d="M2 7C2 3.68629 4.68629 1 8 1H28C31.3137 1 34 3.68629 34 7V27C34 30.3137 31.3137 33 28 33H8C4.68629 33 2 30.3137 2 27V7Z"
          fill="#079455"
        />
        <path
          d="M3 7C3 4.23858 5.23858 2 8 2H28C30.7614 2 33 4.23858 33 7V27C33 29.7614 30.7614 32 28 32H8C5.23858 32 3 29.7614 3 27V7Z"
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
        />
        <g clipPath={`url(#${clipPathId})`}>
          <path
            d="M17.9717 27.0002C14.3361 27.0002 11.3793 24.0437 11.3793 20.4081C11.3793 16.774 14.3361 13.8169 17.9717 13.8169C21.6061 13.8169 24.5632 16.774 24.5632 20.4081C24.5635 24.0437 21.6061 27.0002 17.9717 27.0002Z"
            stroke="white"
            strokeWidth="0.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M25.9128 12.3494C25.1576 12.3494 24.4586 12.5703 23.8538 12.9331C23.8538 12.9164 23.8574 12.9015 23.8574 12.8858C23.8574 9.63533 21.2215 7 17.9701 7C14.7193 7 12.0855 9.63533 12.0855 12.8858C12.0855 12.9018 12.0873 12.9173 12.0873 12.9331C11.4837 12.5709 10.7847 12.3494 10.029 12.3494C7.80422 12.3494 5.99976 14.1533 5.99976 16.3783C5.99976 18.6037 7.80422 20.4075 10.029 20.4075H11.3789C11.3789 16.7735 14.3357 13.816 17.9713 13.816C21.6057 13.816 24.5628 16.7735 24.5628 20.4075H25.9128C28.1375 20.4075 29.9413 18.6037 29.9413 16.3783C29.9413 14.1533 28.1375 12.3494 25.9128 12.3494Z"
            stroke="white"
            strokeWidth="0.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.9704 26.9808C19.7857 26.9808 21.2572 24.0382 21.2572 20.4084C21.2572 16.7785 19.7857 13.8359 17.9704 13.8359C16.1552 13.8359 14.6836 16.7785 14.6836 20.4084C14.6836 24.0382 16.1552 26.9808 17.9704 26.9808Z"
            stroke="white"
            strokeWidth="0.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.9708 26.9802C21.6005 26.9802 24.5429 24.0377 24.5429 20.4081C24.5429 16.7784 21.6005 13.8359 17.9708 13.8359C14.3411 13.8359 11.3987 16.7784 11.3987 20.4081C11.3987 24.0377 14.3411 26.9802 17.9708 26.9802Z"
            stroke="white"
            strokeWidth="0.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.9713 13.8359V26.9811"
            stroke="white"
            strokeWidth="0.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.9714 17.123C21.6006 17.123 24.5429 18.5945 24.5429 20.4086C24.5429 22.2222 21.6006 23.6955 17.9714 23.6955C14.3416 23.6955 11.3987 22.2225 11.3987 20.4086C11.3987 18.5945 14.3416 17.123 17.9714 17.123Z"
            stroke="white"
            strokeWidth="0.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.9718 26.9808C21.6017 26.9808 24.5442 24.0382 24.5442 20.4084C24.5442 16.7785 21.6017 13.8359 17.9718 13.8359C14.342 13.8359 11.3994 16.7785 11.3994 20.4084C11.3994 24.0382 14.342 26.9808 17.9718 26.9808Z"
            stroke="white"
            strokeWidth="0.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11.3987 20.4082H24.5426"
            stroke="white"
            strokeWidth="0.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
      <defs>
        <filter
          id={filterId}
          x="0"
          y="0"
          width="36"
          height="36"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="1" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.05 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_6543_3709" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_6543_3709" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="-2" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.05 0" />
          <feBlend mode="normal" in2="shape" result="effect2_innerShadow_6543_3709" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology radius="1" operator="erode" in="SourceAlpha" result="effect3_innerShadow_6543_3709" />
          <feOffset />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.18 0" />
          <feBlend mode="normal" in2="effect2_innerShadow_6543_3709" result="effect3_innerShadow_6543_3709" />
        </filter>
        <linearGradient id={gradientId} x1="18" y1="1" x2="18" y2="33" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.12" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <clipPath id={clipPathId}>
          <rect width="24" height="24" fill="white" transform="translate(6 5)" />
        </clipPath>
      </defs>
    </svg>
  );
};
export default PublicIcon;

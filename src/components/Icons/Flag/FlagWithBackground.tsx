import { FC } from "react";

import { SVGIconProps } from "src/types/common/generalTypes";

const FlagWithBackground: FC<SVGIconProps> = (props) => (
  <svg width={52} height={53} viewBox="0 0 52 53" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g filter="url(#filter0_dii_10108_1692)">
      <path
        d="M2 11.5439C2 6.0211 6.47715 1.54395 12 1.54395H40C45.5229 1.54395 50 6.0211 50 11.5439V39.5439C50 45.0668 45.5228 49.5439 40 49.5439H12C6.47715 49.5439 2 45.0668 2 39.5439V11.5439Z"
        fill="#4B5565"
      />
      <path
        d="M3 11.5439C3 6.57338 7.02944 2.54395 12 2.54395H40C44.9706 2.54395 49 6.57338 49 11.5439V39.5439C49 44.5145 44.9706 48.5439 40 48.5439H12C7.02944 48.5439 3 44.5145 3 39.5439V11.5439Z"
        stroke="url(#paint0_linear_10108_1692)"
        strokeWidth={2}
      />
      <path
        d="M28.0913 20.2662H34.0451C34.5172 20.2662 34.7533 20.2662 34.8914 20.3654C35.0118 20.452 35.0903 20.5854 35.1075 20.7327C35.1272 20.9016 35.0126 21.108 34.7833 21.5207L33.3624 24.0783C33.2792 24.228 33.2376 24.3028 33.2213 24.3821C33.2069 24.4522 33.2069 24.5246 33.2213 24.5947C33.2376 24.674 33.2792 24.7488 33.3624 24.8985L34.7833 27.4561C35.0126 27.8688 35.1272 28.0752 35.1075 28.2441C35.0903 28.3914 35.0118 28.5247 34.8914 28.6113C34.7533 28.7106 34.5172 28.7106 34.0451 28.7106H26.6136C26.0224 28.7106 25.7268 28.7106 25.501 28.5956C25.3024 28.4944 25.1409 28.3329 25.0397 28.1343C24.9247 27.9085 24.9247 27.6129 24.9247 27.0217V24.4884M21.2302 35.0439L17.008 18.1551M18.5914 24.4884H26.4024C26.9936 24.4884 27.2892 24.4884 27.515 24.3733C27.7136 24.2721 27.8751 24.1107 27.9763 23.912C28.0913 23.6863 28.0913 23.3907 28.0913 22.7995V17.7328C28.0913 17.1417 28.0913 16.8461 27.9763 16.6203C27.8751 16.4217 27.7136 16.2602 27.515 16.159C27.2892 16.0439 26.9936 16.0439 26.4024 16.0439H18.6433C17.906 16.0439 17.5373 16.0439 17.2852 16.1967C17.0642 16.3306 16.8999 16.5409 16.8236 16.7878C16.7366 17.0695 16.826 17.4272 17.0048 18.1425L18.5914 24.4884Z"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <filter
        id="filter0_dii_10108_1692"
        x={0}
        y={0.543945}
        width={52}
        height={52}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={1} />
        <feGaussianBlur stdDeviation={1} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.05 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_10108_1692" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_10108_1692" result="shape" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={-2} />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.05 0" />
        <feBlend mode="normal" in2="shape" result="effect2_innerShadow_10108_1692" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feMorphology radius={1} operator="erode" in="SourceAlpha" result="effect3_innerShadow_10108_1692" />
        <feOffset />
        <feComposite in2="hardAlpha" operator="arithmetic" k2={-1} k3={1} />
        <feColorMatrix type="matrix" values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.18 0" />
        <feBlend mode="normal" in2="effect2_innerShadow_10108_1692" result="effect3_innerShadow_10108_1692" />
      </filter>
      <linearGradient
        id="paint0_linear_10108_1692"
        x1={26}
        y1={1.54395}
        x2={26}
        y2={49.5439}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="white" stopOpacity={0.12} />
        <stop offset={1} stopColor="white" stopOpacity={0} />
      </linearGradient>
    </defs>
  </svg>
);
export default FlagWithBackground;

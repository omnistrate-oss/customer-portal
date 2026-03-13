import { useId } from "react";

const SpeedometerIcon = (props) => {
  const clipPathId = useId();
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="none" {...props}>
      <g clipPath={`url(#${clipPathId})`}>
        <path
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.667}
          d="M4.167 10A5.833 5.833 0 0 1 10 4.167m3.75 2.083L10 10m8.333 0a8.333 8.333 0 1 1-16.666 0 8.333 8.333 0 0 1 16.666 0Zm-7.5 0a.833.833 0 1 1-1.666 0 .833.833 0 0 1 1.666 0Z"
        />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <path fill="#fff" d="M0 0h20v20H0z" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default SpeedometerIcon;

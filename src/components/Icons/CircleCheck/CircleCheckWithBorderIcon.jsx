import { useId } from "react";

function CircleCheckWithBorderIcon(props) {
  const { height = 16, width = 16, ...restProps } = props;
  const clipPathId = useId();

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...restProps}
    >
      <g clipPath={`url(#${clipPathId})`}>
        <path
          d="M4.99967 8.00016L6.99967 10.0002L10.9997 6.00016M14.6663 8.00016C14.6663 11.6821 11.6816 14.6668 7.99967 14.6668C4.31778 14.6668 1.33301 11.6821 1.33301 8.00016C1.33301 4.31826 4.31778 1.3335 7.99967 1.3335C11.6816 1.3335 14.6663 4.31826 14.6663 8.00016Z"
          stroke="#079455"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export default CircleCheckWithBorderIcon;

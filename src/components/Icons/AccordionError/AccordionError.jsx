import { useId } from "react";

const AccordionErrorIcon = (props) => {
  const clipPathId = useId();
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={17} fill="none" {...props}>
      <g clipPath={`url(#${clipPathId})`}>
        <path
          stroke="#D92D20"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="m10 6.627-4 4m0-4 4 4m4.667-2a6.667 6.667 0 1 1-13.334 0 6.667 6.667 0 0 1 13.334 0Z"
        />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <path fill="#fff" d="M0 .627h16v16H0z" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default AccordionErrorIcon;

import { useId } from "react";

const AccordionValidIcon = (props) => {
  const clipPathId = useId();
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="none" {...props}>
      <g clipPath={`url(#${clipPathId})`}>
        <path
          stroke="#039855"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14.666 7.39v.614a6.666 6.666 0 1 1-3.953-6.094m3.953.757L8 9.34l-2-2"
        />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <path fill="#fff" d="M0 0h16v16H0z" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default AccordionValidIcon;

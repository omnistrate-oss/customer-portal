import { useId } from "react";

const EndpointIcon = () => {
  const clipPathId = useId();
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <rect x="2" y="2" width="32" height="32" rx="16" fill="#F4EBFF" />
        <rect x="2" y="2" width="32" height="32" rx="16" stroke="#F9F5FF" strokeWidth="4" />
        <g clipPath={`url(#${clipPathId})`}>
          <path
            d="M11.3333 18L17.7615 21.2141C17.8489 21.2578 17.8927 21.2797 17.9385 21.2883C17.9792 21.2959 18.0208 21.2959 18.0615 21.2883C18.1073 21.2797 18.1511 21.2578 18.2385 21.2141L24.6667 18M11.3333 21.3333L17.7615 24.5474C17.8489 24.5911 17.8927 24.613 17.9385 24.6216C17.9792 24.6292 18.0208 24.6292 18.0615 24.6216C18.1073 24.613 18.1511 24.5911 18.2385 24.5474L24.6667 21.3333M11.3333 14.6667L17.7615 11.4526C17.8489 11.4089 17.8927 11.387 17.9385 11.3784C17.9792 11.3708 18.0208 11.3708 18.0615 11.3784C18.1073 11.387 18.1511 11.4089 18.2385 11.4526L24.6667 14.6667L18.2385 17.8807C18.1511 17.9245 18.1073 17.9463 18.0615 17.9549C18.0208 17.9626 17.9792 17.9626 17.9385 17.9549C17.8927 17.9463 17.8489 17.9245 17.7615 17.8807L11.3333 14.6667Z"
            stroke="#7F56D9"
            strokeWidth="1.33333"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <rect width="16" height="16" fill="white" transform="translate(10 10)" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default EndpointIcon;

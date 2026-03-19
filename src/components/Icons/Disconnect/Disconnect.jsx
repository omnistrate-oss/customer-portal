import { useId } from "react";

import { colors } from "src/themeConfig";

const DisconnectIcon = (props) => {
  const { color = colors.gray700, disabled } = props;
  const clipPathId = useId();

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g clipPath={`url(#${clipPathId})`}>
        <path
          d="M7.49984 3.33332V1.66666M12.4998 16.6667V18.3333M3.33317 7.49999H1.6665M16.6665 12.5H18.3332M4.09502 4.09517L2.9165 2.91666M15.9047 15.9048L17.0832 17.0833M9.99984 14.714L8.23207 16.4818C6.93032 17.7835 4.81977 17.7835 3.51802 16.4818C2.21628 15.1801 2.21628 13.0695 3.51802 11.7678L5.28579 9.99999M14.7139 9.99999L16.4817 8.23222C17.7834 6.93048 17.7834 4.81993 16.4817 3.51818C15.1799 2.21643 13.0694 2.21643 11.7676 3.51818L9.99984 5.28595"
          stroke={disabled ? "#A4A7AE" : color}
          strokeWidth={1.667}
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
export default DisconnectIcon;

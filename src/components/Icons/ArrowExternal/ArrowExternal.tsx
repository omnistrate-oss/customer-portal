import { FC } from "react";

type ExternalArrowIconProps = {
  color?: string;
  width?: number;
  height?: number;
};

const ExternalArrowIcon: FC<ExternalArrowIconProps> = ({
  color = "#7F56D9",
  width = 16,
  height = 16,
  ...otherProps
}) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} fill="none" {...otherProps}>
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="m4 12 8-8m0 0H6.667M12 4v5.333"
      />
    </svg>
  );
};

export default ExternalArrowIcon;

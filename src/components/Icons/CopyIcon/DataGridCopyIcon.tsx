import { FC } from "react";
import type * as CSS from "csstype";

import { colors } from "src/themeConfig";

type DataGridTextProps = {
  color?: string;
  style?: CSS.Properties;
  onClick?: () => void;
};

const DataGridCopyIcon: FC<DataGridTextProps> = ({ color = colors.purple700, style, onClick }) => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={style} onClick={onClick}>
      <g clipPath="url(#clip0_126_13640)">
        <path
          d="M4.16666 12.5C3.39009 12.5 3.0018 12.5 2.69552 12.3731C2.28714 12.204 1.96268 11.8795 1.79352 11.4711C1.66666 11.1648 1.66666 10.7766 1.66666 9.99999V4.33332C1.66666 3.3999 1.66666 2.93319 1.84831 2.57667C2.0081 2.26307 2.26307 2.0081 2.57667 1.84831C2.93319 1.66666 3.3999 1.66666 4.33332 1.66666H9.99999C10.7766 1.66666 11.1648 1.66666 11.4711 1.79352C11.8795 1.96268 12.204 2.28714 12.3731 2.69552C12.5 3.0018 12.5 3.39009 12.5 4.16666M10.1667 18.3333H15.6667C16.6001 18.3333 17.0668 18.3333 17.4233 18.1517C17.7369 17.9919 17.9919 17.7369 18.1517 17.4233C18.3333 17.0668 18.3333 16.6001 18.3333 15.6667V10.1667C18.3333 9.23324 18.3333 8.76653 18.1517 8.41001C17.9919 8.0964 17.7369 7.84143 17.4233 7.68165C17.0668 7.49999 16.6001 7.49999 15.6667 7.49999H10.1667C9.23324 7.49999 8.76653 7.49999 8.41001 7.68165C8.0964 7.84143 7.84143 8.0964 7.68165 8.41001C7.49999 8.76653 7.49999 9.23324 7.49999 10.1667V15.6667C7.49999 16.6001 7.49999 17.0668 7.68165 17.4233C7.84143 17.7369 8.0964 17.9919 8.41001 18.1517C8.76653 18.3333 9.23324 18.3333 10.1667 18.3333Z"
          stroke={color}
          strokeWidth="1.66667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_126_13640">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default DataGridCopyIcon;

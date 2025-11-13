import { colors } from "src/themeConfig";

const RestoreInstanceIcon = (props) => {
  const { color = colors.gray500, disabled, ...restProps } = props;

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...restProps}>
      <path
        d="M13.6356 8.5952C13.4504 10.3351 12.4645 11.9656 10.8332 12.9075C8.12287 14.4723 4.65719 13.5436 3.09238 10.8333L2.92571 10.5446M2.36419 7.40473C2.54939 5.6648 3.53525 4.03432 5.16658 3.09247C7.8769 1.52767 11.3426 2.45629 12.9074 5.16662L13.0741 5.45529M2.32886 12.0439L2.81689 10.2226L4.63826 10.7106M11.3616 5.2893L13.1829 5.77733L13.671 3.95597M7.99991 4.99995V7.99995L9.66658 8.99995"
        stroke={disabled ? colors.gray400 : color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default RestoreInstanceIcon;

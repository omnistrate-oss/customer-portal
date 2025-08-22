import { colors } from "src/themeConfig";

const UpgradeIcon = ({ disabled }: { disabled?: boolean }) => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.6666 7.99999L7.99992 5.33333M7.99992 5.33333L5.33325 8M7.99992 5.33333V11.4667C7.99992 12.3938 7.99992 12.8574 8.36693 13.3764C8.61078 13.7213 9.31287 14.1469 9.7314 14.2036C10.3613 14.2889 10.6005 14.1641 11.079 13.9146C13.211 12.8024 14.6666 10.5712 14.6666 7.99999C14.6666 4.3181 11.6818 1.33333 7.99992 1.33333C4.31802 1.33333 1.33325 4.3181 1.33325 8C1.33325 10.4676 2.67391 12.6221 4.66659 13.7748"
        stroke={disabled ? colors.gray400 : colors.gray500}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default UpgradeIcon;

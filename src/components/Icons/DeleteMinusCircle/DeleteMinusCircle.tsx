import { FC, SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  color?: string;
  disabled?: boolean;
};

const DeleteMinusCircle: FC<Props> = ({ color = "#B42318", disabled, ...rest }) => (
  <svg
    width={20}
    height={20}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <path
      d="M6.66602 10.0001H13.3327M18.3327 10.0001C18.3327 14.6025 14.6017 18.3334 9.99935 18.3334C5.39698 18.3334 1.66602 14.6025 1.66602 10.0001C1.66602 5.39771 5.39698 1.66675 9.99935 1.66675C14.6017 1.66675 18.3327 5.39771 18.3327 10.0001Z"
      stroke={disabled ? "#E0E0E0" : color}
      strokeWidth={1.66667}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default DeleteMinusCircle;

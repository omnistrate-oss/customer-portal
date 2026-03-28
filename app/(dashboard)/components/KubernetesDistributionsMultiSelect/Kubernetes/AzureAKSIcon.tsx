import { FC, useId } from "react";

import { SVGIconProps } from "src/types/common/generalTypes";

const AzureAKSIcon: FC<SVGIconProps> = (props) => {
  const gradientIdA = useId();
  const gradientIdB = useId();
  const gradientIdC = useId();
  const gradientIdD = useId();
  const gradientIdE = useId();
  const gradientIdF = useId();
  const gradientIdG = useId();
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={39} height={34} fill="none" {...props}>
      <path fill={`url(#${gradientIdA})`} d="M12.402 0 6.288 1.133v8.34l6.114 1.304 6.136-2.458V2.095L12.402 0Z" />
      <path
        fill="#341A6E"
        d="M6.288 1.132v8.342l6.177 1.303V.085L6.288 1.132ZM8.897 8.83l-1.732-.34V2.072l1.732-.275V8.83Zm2.694.495L9.6 9.001V1.669l1.99-.344v8Z"
      />
      <path fill={`url(#${gradientIdB})`} d="M25.637.107 19.522 1.24v8.338l6.115 1.306 6.117-2.48V2.2L25.637.107Z" />
      <path
        fill="#341A6E"
        d="M19.522 1.24v8.338l6.137 1.306V.192L19.522 1.24Zm2.587 7.698-1.732-.341V2.18l1.732-.275v7.033Zm2.695.492-1.985-.322V1.776l1.988-.366-.003 8.02Z"
      />
      <path
        fill={`url(#${gradientIdC})`}
        d="M6.136 11.503.022 12.638v8.339l6.114 1.303 6.137-2.458v-6.221l-6.137-2.098Z"
      />
      <path
        fill="#341A6E"
        d="M0 12.638v8.275l6.18 1.303V11.524L0 12.638Zm2.587 7.717-1.732-.363v-6.411l1.732-.3v7.074Zm2.716.558-1.987-.322v-7.42l1.987-.34v8.082Z"
      />
      <path
        fill={`url(#${gradientIdD})`}
        d="m19.33 11.418-6.114 1.135v8.339l6.114 1.325 6.114-2.48v-6.221l-6.114-2.098Z"
      />
      <path
        fill="#341A6E"
        d="M13.216 12.553v8.357l6.158 1.306V11.524l-6.158 1.029ZM15.8 20.27l-1.732-.363v-6.414l1.732-.303v7.08Zm2.694.47-1.988-.319v-7.335l1.99-.34-.002 7.994Z"
      />
      <path
        fill={`url(#${gradientIdE})`}
        d="m32.524 11.524-6.117 1.133v8.341l6.117 1.303 6.136-2.457v-6.225l-6.136-2.095Z"
      />
      <path
        fill="#341A6E"
        d="M26.407 12.657v8.256l6.18 1.303V11.524l-6.18 1.133Zm2.611 7.72-1.732-.363V13.6l1.732-.302v7.079Zm2.695.47-1.99-.319v-7.335l1.987-.343v8l.003-.003Z"
      />
      <path
        fill={`url(#${gradientIdF})`}
        d="m12.253 23.135-6.117 1.113v8.339l6.117 1.325 6.137-2.48v-6.2l-6.137-2.097Z"
      />
      <path
        fill="#341A6E"
        d="M6.136 24.248v8.339l6.18 1.328V23.05l-6.18 1.198Zm2.612 7.72-1.732-.363V25.19l1.732-.3v7.08Zm2.694.493-1.99-.322v-7.354l1.988-.344v8.02h.002Z"
      />
      <path
        fill={`url(#${gradientIdG})`}
        d="m25.466 23.223-6.114 1.132v8.339L25.466 34l6.137-2.46v-6.22l-6.137-2.095v-.002Z"
      />
      <path
        fill="#341A6E"
        d="M19.352 24.356v8.338L25.532 34V23.306l-6.18 1.05Zm2.609 7.72-1.732-.366v-6.414l1.732-.3v7.08Zm2.694.467-1.99-.319V24.89l1.99-.34v7.997-.003Z"
      />
      <defs>
        <linearGradient id={gradientIdA} x1={6.288} x2={18.538} y1={5.389} y2={5.389} gradientUnits="userSpaceOnUse">
          <stop stopColor="#B77AF4" />
          <stop offset={1} stopColor="#773ADC" />
        </linearGradient>
        <linearGradient id={gradientIdB} x1={19.522} x2={31.754} y1={5.496} y2={5.496} gradientUnits="userSpaceOnUse">
          <stop stopColor="#B77AF4" />
          <stop offset={1} stopColor="#773ADC" />
        </linearGradient>
        <linearGradient id={gradientIdC} x1={0.022} x2={12.253} y1={16.892} y2={16.892} gradientUnits="userSpaceOnUse">
          <stop stopColor="#B77AF4" />
          <stop offset={1} stopColor="#773ADC" />
        </linearGradient>
        <linearGradient id={gradientIdD} x1={13.216} x2={25.444} y1={16.806} y2={16.806} gradientUnits="userSpaceOnUse">
          <stop stopColor="#B77AF4" />
          <stop offset={1} stopColor="#773ADC" />
        </linearGradient>
        <linearGradient id={gradientIdE} x1={26.407} x2={38.66} y1={16.913} y2={16.913} gradientUnits="userSpaceOnUse">
          <stop stopColor="#B77AF4" />
          <stop offset={1} stopColor="#773ADC" />
        </linearGradient>
        <linearGradient id={gradientIdF} x1={6.136} x2={18.39} y1={28.526} y2={28.526} gradientUnits="userSpaceOnUse">
          <stop stopColor="#B77AF4" />
          <stop offset={1} stopColor="#773ADC" />
        </linearGradient>
        <linearGradient id={gradientIdG} x1={19.352} x2={31.603} y1={28.611} y2={28.611} gradientUnits="userSpaceOnUse">
          <stop stopColor="#B77AF4" />
          <stop offset={1} stopColor="#773ADC" />
        </linearGradient>
      </defs>
    </svg>
  );
};
export default AzureAKSIcon;

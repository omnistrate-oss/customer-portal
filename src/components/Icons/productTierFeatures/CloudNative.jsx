import { useId } from "react";

const CloudNative = (props) => {
  const clipPathId = useId();
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x={0.5} y={0.5} width={23} height={23} rx={11.5} fill="white" />
      <rect x={0.5} y={0.5} width={23} height={23} rx={11.5} stroke="#759C3E" />
      <g clipPath={`url(#${clipPathId})`}>
        <path d="M18 14.5161L12.002 13.6187L6 14.5173L12.0005 16.7823L18 14.5161Z" fill="#B7CA9D" />
        <path
          d="M7.20093 14.4112L8.21483 14.734L8.30722 14.6271V7.40077L8.21483 7.27734L7.20093 7.67239V14.4112Z"
          fill="#4B612C"
        />
        <path d="M11.8046 14.0921L8.21484 14.7343V7.27783L11.8046 8.1001V14.0921Z" fill="#759C3E" />
        <path
          d="M10.2041 15.3553L8.80493 14.9159V5.71255L10.2041 5L10.3265 5.13584V15.2033L10.2041 15.3553Z"
          fill="#4B612C"
        />
        <path d="M14.9985 14.2098L10.2041 15.3554V5L14.9985 6.90342V14.2098Z" fill="#759C3E" />
        <path d="M11.9984 16.684L6 14.5171V15.7739L11.9984 18.8288V16.684Z" fill="#4B612C" />
        <path d="M17.9999 15.7726L11.9983 18.829V16.6842L17.9999 14.5161V15.7726Z" fill="#759C3E" />
        <path d="M16.3143 12.4336H14.86L10.7141 12.7213L12 12.9628L16.3143 12.4336Z" fill="#B7CA9D" />
        <path
          d="M10.7141 15.4994L11.9994 15.8922L12.0364 15.8516L12.0353 12.8986L11.9983 12.8624L10.7141 12.7212V15.4994Z"
          fill="#4B612C"
        />
        <path d="M16.3143 12.4336L11.9983 12.8623L11.9994 15.8923L16.3143 14.5692V12.4336Z" fill="#759C3E" />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <rect width={12} height={13.8462} fill="white" transform="translate(6 5)" />
        </clipPath>
      </defs>
    </svg>
  );
};
export default CloudNative;

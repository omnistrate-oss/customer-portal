const InstructionsCircledIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={56} height={56} fill="none" {...props}>
    <g clipPath="url(#a)">
      <path fill="#DCFAE6" d="M52 28C52 14.745 41.255 4 28 4S4 14.745 4 28s10.745 24 24 24 24-10.745 24-24Z" />
      <path
        stroke="#ECFDF3"
        strokeWidth={8}
        d="M52 28C52 14.745 41.255 4 28 4S4 14.745 4 28s10.745 24 24 24 24-10.745 24-24Z"
      />
      <path
        stroke="#067647"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M30 18.27v4.13c0 .56 0 .84.109 1.054a1 1 0 0 0 .437.437c.214.11.494.11 1.054.11h4.13M32 29h-8m8 4h-8m2-8h-2m6-7h-5.2c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C20 20.28 20 21.12 20 22.8v10.4c0 1.68 0 2.52.327 3.162a3 3 0 0 0 1.311 1.311C22.28 38 23.12 38 24.8 38h6.4c1.68 0 2.52 0 3.162-.327a3 3 0 0 0 1.311-1.311C36 35.72 36 34.88 36 33.2V24l-6-6Z"
      />
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h56v56H0z" />
      </clipPath>
    </defs>
  </svg>
);
export default InstructionsCircledIcon;

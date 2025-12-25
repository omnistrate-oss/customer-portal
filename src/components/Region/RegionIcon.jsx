const RegionIcon = (props) => {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g filter="url(#filter0_dii_3965_186)">
        <path
          d="M2 9C2 4.58172 5.58172 1 10 1H26C30.4183 1 34 4.58172 34 9V25C34 29.4183 30.4183 33 26 33H10C5.58172 33 2 29.4183 2 25V9Z"
          fill="white"
        />
        <path
          d="M10 1.5H26C30.1421 1.5 33.5 4.85786 33.5 9V25C33.5 29.1421 30.1421 32.5 26 32.5H10C5.85786 32.5 2.5 29.1421 2.5 25V9C2.5 4.85786 5.85786 1.5 10 1.5Z"
          stroke="#D5D7DA"
        />
        <path
          d="M18 7C20.5013 9.73835 21.9228 13.292 22 17C21.9228 20.708 20.5013 24.2616 18 27M18 7C15.4987 9.73835 14.0772 13.292 14 17C14.0772 20.708 15.4987 24.2616 18 27M18 7C12.4772 7 8 11.4772 8 17C8 22.5228 12.4772 27 18 27M18 7C23.5228 7 28 11.4772 28 17C28 22.5228 23.5228 27 18 27M8.50002 14H27.5M8.5 20H27.5"
          stroke="#7F56D9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <filter
          id="filter0_dii_3965_186"
          x="0"
          y="0"
          width="36"
          height="36"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="1" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.05 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3965_186" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_3965_186" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="-2" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.05 0" />
          <feBlend mode="normal" in2="shape" result="effect2_innerShadow_3965_186" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology radius="1" operator="erode" in="SourceAlpha" result="effect3_innerShadow_3965_186" />
          <feOffset />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.18 0" />
          <feBlend mode="normal" in2="effect2_innerShadow_3965_186" result="effect3_innerShadow_3965_186" />
        </filter>
      </defs>
    </svg>
  );
};

export default RegionIcon;

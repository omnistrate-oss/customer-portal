const AlertIcon = (props) => {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g filter="url(#filter0_dii_8509_13349)">
        <path
          d="M2 9C2 4.58172 5.58172 1 10 1H34C38.4183 1 42 4.58172 42 9V33C42 37.4183 38.4183 41 34 41H10C5.58172 41 2 37.4183 2 33V9Z"
          fill="white"
        />
        <path
          d="M10 1.5H34C38.1421 1.5 41.5 4.85786 41.5 9V33C41.5 37.1421 38.1421 40.5 34 40.5H10C5.85786 40.5 2.5 37.1421 2.5 33V9C2.5 4.85786 5.85786 1.5 10 1.5Z"
          stroke="#E9EAEB"
        />
        <path
          d="M21.9999 18.4999V21.8333M21.9999 25.1666H22.0082M20.846 14.2431L13.9919 26.0819C13.6117 26.7386 13.4216 27.0669 13.4497 27.3364C13.4742 27.5714 13.5974 27.785 13.7885 27.924C14.0077 28.0833 14.387 28.0833 15.1458 28.0833H28.8539C29.6127 28.0833 29.9921 28.0833 30.2112 27.924C30.4024 27.785 30.5255 27.5714 30.55 27.3364C30.5781 27.0669 30.388 26.7386 30.0078 26.0819L23.1538 14.243C22.775 13.5887 22.5856 13.2616 22.3385 13.1517C22.1229 13.0559 21.8768 13.0559 21.6613 13.1517C21.4142 13.2616 21.2248 13.5887 20.846 14.2431Z"
          stroke="#F79009"
          strokeWidth="1.66667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <filter
          id="filter0_dii_8509_13349"
          x="0"
          y="0"
          width="44"
          height="44"
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
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_8509_13349" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_8509_13349" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="-2" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.05 0" />
          <feBlend mode="normal" in2="shape" result="effect2_innerShadow_8509_13349" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology radius="1" operator="erode" in="SourceAlpha" result="effect3_innerShadow_8509_13349" />
          <feOffset />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.18 0" />
          <feBlend mode="normal" in2="effect2_innerShadow_8509_13349" result="effect3_innerShadow_8509_13349" />
        </filter>
      </defs>
    </svg>
  );
};

export default AlertIcon;

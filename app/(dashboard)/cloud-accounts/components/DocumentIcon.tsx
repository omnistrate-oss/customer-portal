const DocumentDialogIcon = () => {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_dii_228_11759)">
        <path
          d="M2 11C2 5.47715 6.47715 1 12 1H40C45.5229 1 50 5.47715 50 11V39C50 44.5229 45.5228 49 40 49H12C6.47715 49 2 44.5228 2 39V11Z"
          fill="white"
        />
        <path
          d="M12 1.5H40C45.2467 1.5 49.5 5.75329 49.5 11V39C49.5 44.2467 45.2467 48.5 40 48.5H12C6.7533 48.5 2.5 44.2467 2.5 39V11C2.5 5.7533 6.75329 1.5 12 1.5Z"
          stroke="#E4E7EC"
        />
        <path
          d="M28 24H22M24 28H22M30 20H22M34 19.8V30.2C34 31.8802 34 32.7202 33.673 33.362C33.3854 33.9265 32.9265 34.3854 32.362 34.673C31.7202 35 30.8802 35 29.2 35H22.8C21.1198 35 20.2798 35 19.638 34.673C19.0735 34.3854 18.6146 33.9265 18.327 33.362C18 32.7202 18 31.8802 18 30.2V19.8C18 18.1198 18 17.2798 18.327 16.638C18.6146 16.0735 19.0735 15.6146 19.638 15.327C20.2798 15 21.1198 15 22.8 15H29.2C30.8802 15 31.7202 15 32.362 15.327C32.9265 15.6146 33.3854 16.0735 33.673 16.638C34 17.2798 34 18.1198 34 19.8Z"
          stroke="#344054"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <filter
          id="filter0_dii_228_11759"
          x="0"
          y="0"
          width="52"
          height="52"
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
          <feColorMatrix type="matrix" values="0 0 0 0 0.0627451 0 0 0 0 0.0941176 0 0 0 0 0.156863 0 0 0 0.05 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_228_11759" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_228_11759" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="-2" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0627451 0 0 0 0 0.0941176 0 0 0 0 0.156863 0 0 0 0.05 0" />
          <feBlend mode="normal" in2="shape" result="effect2_innerShadow_228_11759" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology radius="1" operator="erode" in="SourceAlpha" result="effect3_innerShadow_228_11759" />
          <feOffset />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.0627451 0 0 0 0 0.0941176 0 0 0 0 0.156863 0 0 0 0.18 0" />
          <feBlend mode="normal" in2="effect2_innerShadow_228_11759" result="effect3_innerShadow_228_11759" />
        </filter>
      </defs>
    </svg>
  );
};

export default DocumentDialogIcon;

import * as React from "react";

const EditIcon = (props) => {
  let { color } = props;
  const { disabled = false } = props;
  
  if (!color) {
    color = "#9F1AB1";
  }
  if (disabled) {
    color = "#a3a6ac";
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      fill="none"
      {...props}
    >
      <path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.667}
        d="m17.5 15-.833.912a2.26 2.26 0 0 1-1.667.755 2.26 2.26 0 0 1-1.666-.755 2.264 2.264 0 0 0-1.667-.754c-.625 0-1.224.271-1.667.754m-7.5.755h1.395c.408 0 .612 0 .804-.046.17-.041.332-.109.482-.2.168-.103.312-.247.6-.535L16.25 5.416a1.768 1.768 0 1 0-2.5-2.5L3.281 13.387c-.288.288-.432.432-.535.6-.092.15-.16.312-.2.482-.046.192-.046.396-.046.803v1.396Z"
      />
    </svg>
  );
};

export default EditIcon;

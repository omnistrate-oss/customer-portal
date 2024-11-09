const CircleCrossIcon = (props) => {
  const { color = "#F44336" } = props;
  let colorData = "#F44336";
  if (color !== "") {
    colorData = color;
  }

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8 0.125C-2.40625 0.4625 -2.40625 15.5375 8 15.875C18.4062 15.5375 18.4062 0.4625 8 0.125Z"
        fill={colorData}
      />
      <path
        d="M8.78745 8.00001L11.15 5.63751C11.6562 5.13126 10.8687 4.34376 10.3625 4.85001L7.99995 7.21251L5.63745 4.85001C5.1312 4.34376 4.3437 5.13126 4.84995 5.63751L7.21245 8.00001L4.84995 10.3625C4.3437 10.8688 5.1312 11.6563 5.63745 11.15L7.99995 8.78751L10.3625 11.15C10.8687 11.6563 11.6562 10.8688 11.15 10.3625L8.78745 8.00001Z"
        fill="#EEEEEE"
      />
    </svg>
  );
};

export default CircleCrossIcon;

const SlidersIcon = (props) => {
  const { color = "#17B26A" } = props;
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M4 10.6666L20 10.6666M20 10.6666C20 12.8758 21.7909 14.6666 24 14.6666C26.2091 14.6666 28 12.8758 28 10.6666C28 8.45749 26.2091 6.66663 24 6.66663C21.7909 6.66663 20 8.45749 20 10.6666ZM12 21.3333L28 21.3333M12 21.3333C12 23.5424 10.2091 25.3333 8 25.3333C5.79086 25.3333 4 23.5424 4 21.3333C4 19.1242 5.79086 17.3333 8 17.3333C10.2091 17.3333 12 19.1242 12 21.3333Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
export default SlidersIcon;

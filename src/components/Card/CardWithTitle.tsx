import clsx from "clsx";

import { Text } from "../Typography/Typography";

type CardWithTitleProps = {
  title: string;
  actionButton?: React.ReactNode;
  /** Where to render `actionButton` relative to the title. Defaults to "right". */
  actionButtonPosition?: "left" | "right";
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

const CardWithTitle: React.FC<CardWithTitleProps> = ({
  title,
  actionButton,
  actionButtonPosition = "right",
  children,
  className,
  ...otherProps
}) => {
  const isLeft = actionButton && actionButtonPosition === "left";
  return (
    <div
      className={clsx("bg-white rounded-xl border border-gray-200 shadow-[0_1px_2px_0_#0A0D120D]", className)}
      {...otherProps}
    >
      <div className={clsx("py-5 px-6 border-b border-gray-200 flex items-center gap-3", !isLeft && "justify-between")}>
        {isLeft && <div className="flex-shrink-0 flex items-center">{actionButton}</div>}
        <Text size="large" weight="semibold" color="#6941C6">
          {title}
        </Text>
        {!isLeft && actionButton && <div className="flex-shrink-0">{actionButton}</div>}
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  );
};

export default CardWithTitle;

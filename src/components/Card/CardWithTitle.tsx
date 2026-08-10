import clsx from "clsx";

import { Text } from "../Typography/Typography";

type CardWithTitleProps = {
  title: string;
  description?: React.ReactNode;
  actionButton?: React.ReactNode;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

const CardWithTitle: React.FC<CardWithTitleProps> = ({
  title,
  description,
  actionButton,
  children,
  className,
  ...otherProps
}) => {
  return (
    <div
      className={clsx("bg-white rounded-xl border border-gray-200 shadow-[0_1px_2px_0_#0A0D120D]", className)}
      {...otherProps}
    >
      <div className="py-5 px-6 border-b border-gray-200 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Text size="large" weight="semibold" color="#6941C6">
            {title}
          </Text>
          {description}
        </div>

        {actionButton && <div className="flex-shrink-0">{actionButton}</div>}
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  );
};

export default CardWithTitle;

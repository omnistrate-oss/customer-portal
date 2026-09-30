import { ComponentType, FC } from "react";

import { IconProps, SnapshotCopy, SnapshotCreate, SnapshotRestore } from "src/icons";

type SnapshotDialogIconProps = {
  icon: ComponentType<IconProps>;
};

// A 48px tile in the 52px box the dialog title is laid out around
const SnapshotDialogIcon: FC<SnapshotDialogIconProps> = ({ icon: Icon }) => (
  <div className="flex shrink-0 items-center justify-center w-12 h-12 mt-px mx-0.5 mb-[3px] rounded-[10px] border border-gray-200 bg-gray-25 text-gray-900 shadow-sm">
    <Icon size={34} />
  </div>
);

export const CopySnapshotIcon: FC = () => <SnapshotDialogIcon icon={SnapshotCopy} />;

export const CreateSnapshotIcon: FC = () => <SnapshotDialogIcon icon={SnapshotCreate} />;

export const RestoreSnapshotIcon: FC = () => <SnapshotDialogIcon icon={SnapshotRestore} />;

import { FC } from "react";

import { Text } from "components/Typography/Typography";
import Chip from "src/components/Chip/Chip";
import { TierVersionSet } from "src/types/tier-version-set";
import formatDateUTC from "src/utils/formatDateUTC";

import ReleaseNotesCard from "./ReleaseNotesCard";

type ReleaseCardProps = {
  release: TierVersionSet;
};

const ReleaseCard: FC<ReleaseCardProps> = ({ release }) => {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_2px_0_#0A0D120D] p-6"
      data-testid="release-card"
    >
      <div className="mb-4">
        <Text size="large" weight="semibold" color="#181D27">
          {release.name ?? ""}{" "}
          <Chip
            component="span"
            size="small"
            label={release.version}
            fontColor={"#363F72"}
            bgColor={"#F8F9FC"}
            borderColor={"#D5D9EB"}
          />
        </Text>
        <Text size="small" weight="medium" color="#535862">
          {formatDateUTC(release.releasedAt)}
        </Text>
      </div>

      <ReleaseNotesCard releaseNotes={release?.releaseNotes} />
    </div>
  );
};

export default ReleaseCard;

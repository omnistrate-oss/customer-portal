import { Box } from "@mui/system";
import DOMPurify from "isomorphic-dompurify";
import { FC } from "react";

import { Text } from "components/Typography/Typography";
type ReleaseNotesCardProps = {
  releaseNotes?: string;
};

const ReleaseNotesCard: FC<ReleaseNotesCardProps> = ({ releaseNotes }) => {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <Text size="small" weight="medium" color="#414651" className="mb-3">
        Release Notes
      </Text>

      <div className="flex flex-col pl-4" data-testid="release-notes-content">
        {releaseNotes && releaseNotes !== '<p class="editor-paragraph"><br></p>' ? (
          <div
            style={{
              fontSize: "small",
              fontWeight: 400,
              color: "#535862",
            }}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(releaseNotes),
            }}
          />
        ) : (
          <Box display={"flex"} justifyContent="center" alignItems="center" minHeight="20px">
            <Text color="#344054" size="small" weight="regular">
              No release notes available.
            </Text>
          </Box>
        )}
      </div>
    </div>
  );
};

export default ReleaseNotesCard;

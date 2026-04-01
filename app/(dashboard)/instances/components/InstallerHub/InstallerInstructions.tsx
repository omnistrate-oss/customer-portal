import { Box } from "@mui/material";
import DOMPurify from "isomorphic-dompurify";

import { Text } from "src/components/Typography/Typography";

type InstallerInstructionsProps = {
  installerInstructions: string | undefined;
};

const InstallerInstructions = ({ installerInstructions }: InstallerInstructionsProps) => {
  return (
    <Box
      sx={{
        mt: installerInstructions ? 2 : 0,
        borderRadius: installerInstructions ? "12px" : 0,
        border: "1px solid #E9EAEB",
        boxShadow: "0px 1px 2px 0px #0A0D120D",
      }}
    >
      <Box sx={{ p: 3, borderBottom: "1px solid #E9EAEB" }}>
        <Text color="#42307D" size="small" weight="bold">
          Installer Instructions
        </Text>
        <Text color="#535862" size="small" weight="regular">
          View detailed steps for installing this version on a new instance
        </Text>
      </Box>

      <Box sx={{ p: 3 }}>
        {installerInstructions && installerInstructions !== '<p class="editor-paragraph"><br></p>' ? (
          <div
            style={{
              fontSize: "small",
              fontWeight: 600,
              color: "#344054",
            }}
            dangerouslySetInnerHTML={{
              __html: installerInstructions
                ? DOMPurify.sanitize(installerInstructions)
                : "No installer instructions available.",
            }}
          />
        ) : (
          <Box display={"flex"} justifyContent="center" alignItems="center" minHeight="200px">
            <Text color="#344054" size="small" weight="regular">
              No installer instructions available.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default InstallerInstructions;

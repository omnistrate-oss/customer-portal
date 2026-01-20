import { Box, Modal, styled } from "@mui/material";

import Button from "src/components/Button/Button";
import CodeEditor from "src/components/CodeEditor/CodeEditor";
import Divider from "src/components/Divider/Divider";
import AccordionEditIcon from "src/components/Icons/AccordionEdit/AccordionEdit";
import { Text } from "src/components/Typography/Typography";

const StyledContainer = styled(Box)(() => ({
  position: "fixed",
  top: "0",
  right: "50%",
  transform: "translateX(50%)",
  background: "white",
  borderRadius: "0 0 10px 10px",
  width: "100%",
  maxWidth: "800px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
}));

const TitleContainer = styled(Box)(() => ({
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  gap: "10px",
  padding: "10px 20px",
}));

const ContentSection = styled(Box)(() => ({
  width: "100%",
  padding: "20px 32px",
}));

const Footer = styled(Box)(() => ({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "16px",
}));

function JSONViewModal(props) {
  const { open, handleClose, parameterName = "", parameterDescription = "", jsonData } = props;

  return (
    <Modal open={open} onClose={handleClose}>
      <StyledContainer>
        <TitleContainer>
          <AccordionEditIcon style={{ alignSelf: "start", marginTop: "4px" }} />
          <Box>
            <Text size="small">{parameterName}</Text>
            {parameterDescription && (
              <Text size="small" color="#344054" weight="regular">
                {parameterDescription}
              </Text>
            )}
          </Box>
        </TitleContainer>
        <Divider />

        <ContentSection>
          <CodeEditor
            language="json"
            value={JSON.stringify(jsonData || {}, null, "\t")}
            height="400px"
            isReadOnly={true}
          />
          <Footer sx={{ marginTop: "12px" }}>
            <Button variant="outlined" onClick={handleClose}>
              Close
            </Button>
          </Footer>
        </ContentSection>
      </StyledContainer>
    </Modal>
  );
}

export default JSONViewModal;

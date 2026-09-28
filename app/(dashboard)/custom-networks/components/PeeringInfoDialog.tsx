import { FC } from "react";
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Stack, useTheme } from "@mui/material";

import Button from "src/components/Button/Button";
import CopyButton from "src/components/Button/CopyButton";
import { Text } from "src/components/Typography/Typography";
import { Server05 } from "src/icons";
import { colors } from "src/themeConfig";

export type ListItemProps = {
  title: string;
  value?: string;
  icon?: React.ReactNode;
};

type PeeringInfoDialogProps = {
  open: boolean;
  onClose: () => void;
  list: ListItemProps[];
};

const ListItem: FC<ListItemProps> = ({ title, value, icon }) => {
  return (
    <Stack
      direction="row"
      gap="8px"
      alignItems="center"
      justifyContent="space-between"
      p="16px"
      borderRadius="6px"
      border={`1px solid ${colors.gray200}`}
      mb="12px"
    >
      <Text size="small" weight="medium" color={colors.gray700}>
        {title}
      </Text>

      <Box display="flex" alignItems="center" gap="8px">
        {icon}
        <Text size="small" weight="semibold" color={colors.gray600} ellipsis title={value} maxWidth="180px">
          {value}
        </Text>
        <CopyButton text={value} />
      </Box>
    </Stack>
  );
};

const PeeringInfoDialog: FC<PeeringInfoDialogProps> = ({ open, onClose, list }) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{
        style: {
          borderRadius: "12px",
          minWidth: "480px",
          maxWidth: "480px",
        },
      }}
    >
      <DialogTitle
        sx={{
          pt: "24px",
          pb: "20px",
        }}
      >
        <Stack direction="row" gap="4px" alignItems="center">
          <Server05 size={28} strokeWidth={24 / 28} color={theme.palette.primary.main} />
          <Text size="large" weight="semibold" color={colors.gray900}>
            Peering Info
          </Text>
        </Stack>
        <Text size="small" weight="regular" color={colors.gray600} sx={{ mt: "4px" }}>
          Basic information for setting up VPC peering
        </Text>
      </DialogTitle>
      <DialogContent sx={{ pb: "20px" }}>
        {list?.length <= 1 ? (
          <Text size="small" weight="semibold" sx={{ textAlign: "center", my: "16px" }}>
            Peering information will be available once the setup is complete. Please check back shortly.
          </Text>
        ) : (
          list.map((item, index) => <ListItem key={index} title={item.title} value={item.value} icon={item.icon} />)
        )}
      </DialogContent>
      <DialogActions sx={{ pt: "0px", pr: "24px", pb: "24px" }}>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PeeringInfoDialog;

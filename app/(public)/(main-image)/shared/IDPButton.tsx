import { FC, ReactNode } from "react";
import { Box, styled } from "@mui/material";

import Button from "src/components/Button/Button";
import { IdentityProvider } from "src/types/identityProvider";

import { IDENTITY_PROVIDER_ICON_MAP } from "../signin/constants";
import { getIdentityProviderButtonLabel } from "../signin/utils";

const LogoImg = styled("img")({
  height: "24px",
  width: "24px",
  display: "inline-block",
});

type IDPButtonProps = {
  idp: IdentityProvider;
  onClick: (idp: IdentityProvider) => void;
  "data-testid"?: string;
};

const IDPButton: FC<IDPButtonProps> = ({ idp, onClick, "data-testid": testId }) => {
  const loginButtonIconUrl = idp.loginButtonIconUrl;

  let LoginButtonIcon: ReactNode;
  if (loginButtonIconUrl) {
    LoginButtonIcon = <LogoImg src={loginButtonIconUrl} alt={idp.name} />;
  } else if (IDENTITY_PROVIDER_ICON_MAP[idp.identityProviderName]) {
    const IconComponent: FC = IDENTITY_PROVIDER_ICON_MAP[idp.identityProviderName];
    LoginButtonIcon = <IconComponent />;
  } else {
    LoginButtonIcon = <Box width="24px" height="24px" />;
  }

  return (
    <Button
      variant="outlined"
      size="xlarge"
      startIcon={LoginButtonIcon}
      sx={{ justifyContent: "flex-start" }}
      onClick={() => onClick(idp)}
      data-testid={testId || `idp-button-${idp.name}`}
    >
      <Box display="inline-flex" flexGrow={1} justifyContent="center">
        {getIdentityProviderButtonLabel(idp)}
      </Box>
    </Button>
  );
};

export default IDPButton;

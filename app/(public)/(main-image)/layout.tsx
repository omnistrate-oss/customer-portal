"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Box } from "@mui/material";

import Footer from "src/components/NonDashboardComponents/Footer";
import { authLayoutTestIds } from "src/constants/testIds/auth-layout";
import useEnvironmentType from "src/hooks/useEnvironmentType";

import MainImg from "public/assets/images/non-dashboard/signin-main.svg";

import NonProdPortalBanner from "./signin/components/NonProdPortalBanner";

const MainImageLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isSignInPage = pathname === "/signin";

  const contentMaxWidth = isSignInPage ? 480 : 650;
  const environmentType = useEnvironmentType();
  const isNonProdEnvironment = environmentType !== "PROD";
  const showNonProdBanner = isNonProdEnvironment && isSignInPage;
  return (
    <Box display="flex" flexDirection="column" minHeight="100%">
      {showNonProdBanner && <NonProdPortalBanner />}
      <Box display="grid" flex={1} gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}>
        {/* Image Box */}
        <Box
          p="50px 36px"
          data-testid={authLayoutTestIds.heroPanel}
          sx={{
            display: { xs: "none", md: "grid" },
            placeItems: "center",
            minWidth: 0,
            boxShadow: "0px 12px 16px -4px #10182814",
          }}
        >
          <Image
            src={MainImg}
            alt="Hero Image"
            width={646}
            height={484}
            style={{ maxWidth: "100%", height: "auto" }}
            priority
          />
        </Box>
        <Box
          data-testid={authLayoutTestIds.formPanel}
          sx={{
            position: "relative", // For the Footer
            display: "grid",
            placeItems: "center",
            minWidth: 0,
            padding: { xs: "32px 16px 24px", sm: "48px 32px 24px", md: "24px 55px 100px" },
          }}
        >
          <Box maxWidth={contentMaxWidth} width="100%" mx="auto">
            {children}
          </Box>
          <Footer floatOnlyFromMd />
        </Box>
      </Box>
    </Box>
  );
};

export default MainImageLayout;

"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Box } from "@mui/material";

import Footer from "src/components/NonDashboardComponents/Footer";
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
    <Box height="100%">
      {showNonProdBanner && <NonProdPortalBanner />}
      <Box display="grid" gridTemplateColumns="1fr 1fr" height={showNonProdBanner ? "calc(100% - 77px)" : "100%"}>
        {/* Image Box */}
        <Box
          p="50px 36px"
          sx={{
            display: "grid",
            placeItems: "center",
            boxShadow: "0px 12px 16px -4px #10182814",
          }}
        >
          <Image
            src={MainImg}
            alt="Hero Image"
            width={646}
            height={484}
            style={{ maxWidth: "800px", height: "auto" }}
            priority
          />
        </Box>
        <Box
          sx={{
            position: "relative", // For the Footer
            display: "grid",
            placeItems: "center",
            padding: "24px 55px 100px",
          }}
        >
          <Box maxWidth={contentMaxWidth} width="100%" mx="auto">
            {children}
          </Box>
          <Footer />
        </Box>
      </Box>
    </Box>
  );
};

export default MainImageLayout;

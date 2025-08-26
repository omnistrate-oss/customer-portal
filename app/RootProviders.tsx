"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { ThemeProvider } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";

import ProviderFavicon from "src/components/ProviderFavicon/ProviderFavicon";
import SnackbarProvider from "src/components/SnackbarProvider/SnackbarProvider";
import { PAGE_TITLE_MAP } from "src/constants/pageTitleMap";
import CookieConsentProvider from "src/context/cookieConsentContext";
import EnvironmentTypeProvider from "src/context/EnvironmentTypeProvider";
import NotificationBarProvider from "src/context/NotificationBarProvider";
import AxiosGlobalErrorHandler from "src/providers/AxiosGlobalErrorHandler";
import GlobalErrorHandler from "src/providers/GlobalErrorHandler";
import ProviderOrgDetailsProvider from "src/providers/ProviderOrgDetailsProvider";
import { store } from "src/redux-store";
import { EnvironmentType } from "src/types/common/enums";
import { ProviderUser } from "src/types/users";
import { cleanupRecaptchaErrorHandler, suppressRecaptchaErrors } from "src/utils/suppressRecaptchaErrors";

import { theme as dashboardTheme } from "../styles/theme";

import "../styles/globals.css";
import "../styles/nprogress.css";
import "../styles/quill-editor.css";
import "../styles/lexical-editor.css";
import "../styles/monaco-editor.css";
import "../src/components/DateRangePicker/date-range-picker-styles.css";

const queryQlient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      retryOnMount: false,
    },
  },
});

// const nonDashboardRoutes = ["/404", "/signin", "/signup", "/change-password", "/reset-password"];

const RootProviders = ({
  children,
  envType,
  providerOrgDetails,
  googleAnalyticsTagID,
}: {
  children: React.ReactNode;
  envType: EnvironmentType;
  providerOrgDetails: ProviderUser;
  googleAnalyticsTagID: string | undefined;
}) => {
  const pathname = usePathname();
  // const isDashboardRoute = !nonDashboardRoutes.includes(pathname as string);

  // Set Page Title
  useEffect(() => {
    document.title =
      PAGE_TITLE_MAP[pathname as keyof typeof PAGE_TITLE_MAP] || providerOrgDetails?.orgName || "Dashboard";
  }, [pathname, providerOrgDetails?.orgName]);

  // Global reCAPTCHA error suppression
  useEffect(() => {
    suppressRecaptchaErrors();

    // Cleanup on unmount
    return () => {
      cleanupRecaptchaErrorHandler();
    };
  }, []);

  return (
    <AppRouterCacheProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryQlient}>
          <Suspense>
            <ProviderFavicon />
            <SnackbarProvider>
              <NotificationBarProvider>
                <AxiosGlobalErrorHandler />
                <GlobalErrorHandler />
                <ThemeProvider theme={dashboardTheme}>
                  <EnvironmentTypeProvider envType={envType}>
                    <ProviderOrgDetailsProvider details={providerOrgDetails}>
                      <CookieConsentProvider googleAnalyticsTagID={googleAnalyticsTagID}>
                        {children}
                        <ProgressBar height="3px" color="#8d67df" options={{ showSpinner: false }} />
                      </CookieConsentProvider>
                    </ProviderOrgDetailsProvider>
                  </EnvironmentTypeProvider>
                </ThemeProvider>
              </NotificationBarProvider>
            </SnackbarProvider>
          </Suspense>
        </QueryClientProvider>
      </Provider>
    </AppRouterCacheProvider>
  );
};

export default RootProviders;

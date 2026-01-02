import { Metadata } from "next";

import { ENVIRONMENT_TYPES } from "src/constants/environmentTypes";
import { getProviderOrgDetails } from "src/server/api/customer-user";
import { EnvironmentType } from "src/types/common/enums";
import { ProviderUser } from "src/types/users";

// import Script from "next/script";
import RootProviders from "./RootProviders";

import "./globals.css";

export const metadata: Metadata = {
  title: "Omnistrate",
  description: "Working template for a SaaS service Front-end for Services created using Omnistrate",
};

export const dynamic = "force-dynamic";

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const providerOrgDetails: { data: ProviderUser } = await getProviderOrgDetails();

  return (
    <html lang="en">
      <head>
        {process.env.GOOGLE_ANALYTICS_TAG_ID && (
          <>
            {/* Load GA script early; establish default denied consent but still send a cookieless page_view for modeling */}
            <script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GOOGLE_ANALYTICS_TAG_ID}`} async />
            <script
              id="ga-init"
              dangerouslySetInnerHTML={{
                __html: `
                  (function(){
                    if (window.__gaInitialConfig) return; // avoid duplicate initial config on hydration/re-render
                    window.__gaInitialConfig = true;
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){window.dataLayer.push(arguments);} window.gtag = window.gtag || gtag;
                    gtag('consent','default',{
                      ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',
                      functionality_storage:'denied',personalization_storage:'denied',security_storage:'granted'
                    });
                    gtag('js', new Date());
                    gtag('config', '${process.env.GOOGLE_ANALYTICS_TAG_ID}', { anonymize_ip: true });
                    })();
                `,
              }}
            />
          </>
        )}
        <link rel="icon" href="" id="provider-favicon" />
        <meta httpEquiv="cache-control" content="no-cache" />
        <meta httpEquiv="expires" content="0" />
        <meta httpEquiv="pragma" content="no-cache" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          // @ts-ignore
          crossOrigin="true"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <RootProviders
          envType={(process.env.ENVIRONMENT_TYPE || ENVIRONMENT_TYPES.PROD) as EnvironmentType}
          providerOrgDetails={providerOrgDetails.data}
          googleAnalyticsTagID={process.env.GOOGLE_ANALYTICS_TAG_ID}
        >
          {children}
        </RootProviders>
      </body>
    </html>
  );
};

export default RootLayout;

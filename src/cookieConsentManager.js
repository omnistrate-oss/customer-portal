// Build initial consent object; include analytics only if a GA Measurement ID is provided.
export const getCookieConsentInitialObject = (googleAnalyticsTagID) => {
  const base = {
    consentGiven: false,
    categories: [
      {
        category: "necessary",
        services: [
          { type: "auth", name: "token", cookies: ["token"] },
          { type: "OAuth_providers", name: "OAuth" },
        ],
        hide: false,
        editable: false,
        enabled: true,
      },
    ],
  };

  if (googleAnalyticsTagID) {
    base.categories.push({
      category: "analytics",
      services: [
        {
          type: "script", // We still treat GA as a script category for handler logic
          name: "googletagmanager",
          gtag: googleAnalyticsTagID,
          cookies: ["_ga", "_ga_*", "_gid"],
          handleEnable: "grantAnalyticsConsent",
          handleDisable: "revokeAnalyticsConsent",
        },
      ],
      hide: false,
      editable: true,
      enabled: false, // user must opt-in to enable
    });
  }

  return base;
};

// Internal simple state flags to avoid repeated identical consent updates.
let _analyticsGranted = false;

const handlerMap = {
  grantAnalyticsConsent,
  revokeAnalyticsConsent,
};

function grantAnalyticsConsent() {
  if (typeof window === "undefined" || typeof window.gtag !== "function" || !this.gtag) return;
  if (_analyticsGranted) return; // already granted
  window.gtag("consent", "update", { analytics_storage: "granted" });
  window.gtag("config", this.gtag);
  _analyticsGranted = true;
}

const removeCookies = (cookieNames) => {
  cookieNames?.forEach((name) => {
    const allCookies = document.cookie.split("; ");
    const domains = [location.hostname];
    const paths = ["/"];
    const deleteCookie = (cookieName) => {
      domains.forEach((domain) =>
        paths.forEach(
          (path) =>
            (document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`)
        )
      );
    };
    if (name.includes("*")) {
      const regex = new RegExp(`^${name.replace("*", ".*")}`);
      allCookies.forEach((cookie) => {
        const cookieName = cookie.split("=")[0];
        if (regex.test(cookieName)) deleteCookie(cookieName);
      });
    } else {
      deleteCookie(name);
    }
  });
};

function revokeAnalyticsConsent() {
  if (typeof window === "undefined" || typeof window.gtag !== "function" || !this.gtag) return;
  if (!_analyticsGranted) return;

  window.gtag("consent", "update", { analytics_storage: "denied" });
  if (this.cookies?.length) removeCookies(this.cookies);
  _analyticsGranted = false;
}

export const handleConsentChanges = (categories) => {
  categories?.forEach((cat) => {
    cat.services?.forEach((srv) => {
      if (srv.type === "script") {
        if (cat.enabled) {
          if (srv.handleEnable) handlerMap[srv.handleEnable]?.call(srv);
        } else {
          if (srv.handleDisable) handlerMap[srv.handleDisable]?.call(srv);
        }
      }
    });
  });
};

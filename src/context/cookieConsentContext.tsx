import { createContext, ReactNode, useContext, useEffect, useState } from "react";

import CookieConsentModal from "src/components/CookieConsent/CookieConsentModal";
import { getCookieConsentInitialObject, handleConsentChanges } from "src/cookieConsentManager";
import { CategoryWithoutServices, CookieConsent } from "src/types/cookieConsent";

type CookieConsentContextType = {
  consentState: CookieConsent;
  updateConsent: (updatedCategories: CategoryWithoutServices[]) => void;
  isConsentModalOpen: boolean;
  setIsConsentModalOpen: (isOpen: boolean) => void;
};

// Default value for context
const defaultContextValue: CookieConsentContextType = {
  consentState: getCookieConsentInitialObject() as CookieConsent,
  updateConsent: () => {},
  isConsentModalOpen: false,
  setIsConsentModalOpen: () => {},
};

export const CookieConsentContext = createContext<CookieConsentContextType>(defaultContextValue);

type CookieConsentProviderProps = {
  children: ReactNode;
  googleAnalyticsTagID: string | undefined;
};

export default function CookieConsentProvider({ children, googleAnalyticsTagID }: CookieConsentProviderProps) {
  const [consentState, setConsentState] = useState(
    getCookieConsentInitialObject(googleAnalyticsTagID) as CookieConsent
  );
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

  const [isInitialLoad, setIsIntialLoad] = useState(true);

  // Runs only on the client after the first render
  useEffect(() => {
    try {
      const storedConsent = localStorage.getItem("cookieConsent");
      const parsedConsent = storedConsent ? JSON.parse(storedConsent) : null;

      if (parsedConsent) {
        // Sync presence/absence or change of GA measurement ID.
        const analyticsCategoryIndex = parsedConsent.categories.findIndex((c) => c.category === "analytics");
        const analyticsCategory = analyticsCategoryIndex >= 0 ? parsedConsent.categories[analyticsCategoryIndex] : null;
        const gaService = analyticsCategory?.services?.find((s) => s.name === "googletagmanager");

        if (googleAnalyticsTagID) {
          // GA ID provided now.
          if (!gaService) {
            // Add analytics category fresh.
            const newAnalytics = getCookieConsentInitialObject(googleAnalyticsTagID).categories.find(
              (c) => c.category === "analytics"
            );
            if (newAnalytics) parsedConsent.categories.push(newAnalytics);
          } else if (gaService.gtag !== googleAnalyticsTagID) {
            gaService.gtag = googleAnalyticsTagID; // update id only; handlers unchanged
          }
        } else if (gaService) {
          // GA ID removed from environment; remove analytics category entirely.
          parsedConsent.categories = parsedConsent.categories.filter((c) => c.category !== "analytics");
        }

        localStorage.setItem("cookieConsent", JSON.stringify(parsedConsent));
        handleConsentChanges(parsedConsent.categories);
        setConsentState(parsedConsent);
      } else {
        localStorage.setItem("cookieConsent", JSON.stringify(getCookieConsentInitialObject(googleAnalyticsTagID)));
      }
      if (!parsedConsent?.consentGiven) setIsConsentModalOpen(true);
    } catch {
      // swallow errors silently
    }
  }, [googleAnalyticsTagID]);

  useEffect(() => {
    // handle changes in consent state
    if (isInitialLoad) {
      setIsIntialLoad(false);
    } else {
      localStorage.setItem("cookieConsent", JSON.stringify(consentState));
      handleConsentChanges(consentState.categories);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consentState]);

  const updateConsent = (updatedCategories: CategoryWithoutServices[]) => {
    const newCategories = consentState.categories.map((cat) => {
      const updatedCategory = updatedCategories.find((uc) => uc.category === cat.category);
      return updatedCategory ? { ...cat, enabled: updatedCategory.enabled } : cat;
    });
    setConsentState({
      ...consentState,
      categories: newCategories,
      consentGiven: true,
    });
  };

  return (
    <CookieConsentContext.Provider
      value={{
        consentState,
        updateConsent,
        isConsentModalOpen,
        setIsConsentModalOpen,
      }}
    >
      {children}
      <CookieConsentModal />
    </CookieConsentContext.Provider>
  );
}

export const useCookieConsentContext = () => useContext(CookieConsentContext);

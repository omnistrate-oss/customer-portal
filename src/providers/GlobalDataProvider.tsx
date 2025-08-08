"use client";

import { createContext, useContext, useMemo } from "react";
import Navbar from "app/(dashboard)/components/Layout/Navbar";
import NoServiceFoundUI from "app/(dashboard)/components/NoServiceFoundUI/NoServiceFoundUI";

import useSubscriptions from "src/hooks/query/useSubscriptions";
import useOrgServiceOfferings from "src/hooks/useOrgServiceOfferings";
import useSubscriptionRequests from "src/hooks/useSubscriptionRequests";
import { ServiceOffering } from "src/types/serviceOffering";
import { Subscription } from "src/types/subscription";
import { SubscriptionRequest } from "src/types/subscriptionRequest";

type Context = {
  subscriptions: Subscription[];
  isSubscriptionsPending: boolean;
  isFetchingSubscriptions: boolean;
  refetchSubscriptions: () => void; // TODO Later: Add a Proper Type

  subscriptionRequests: SubscriptionRequest[];
  isSubscriptionRequestsPending: boolean;
  isFetchingSubscriptionRequests: boolean;
  refetchSubscriptionRequests: () => void; // TODO Later: Add a Proper Type

  serviceOfferings: ServiceOffering[];
  isServiceOfferingsPending: boolean;
  isFetchingServiceOfferings: boolean;
  refetchServiceOfferings: () => void; // TODO Later: Add a Proper Type

  subscriptionsObj: Record<string, Subscription>;
  serviceOfferingsObj: Record<string, Record<string, ServiceOffering>>;
  servicesObj: Record<string, any>;
};

export const GlobalDataContext = createContext<Context | undefined>(undefined);

export const useGlobalData = () => {
  const context = useContext(GlobalDataContext);

  if (context === undefined) {
    throw new Error("useProviderOrgDetails must be used within a ProviderOrgDetailsProvider");
  }

  return context || {};
};

const GlobalDataProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    data: subscriptions = [],
    isPending: isSubscriptionsPending,
    isFetching: isFetchingSubscriptions,
    refetch: refetchSubscriptions,
  } = useSubscriptions();

  const {
    data: subscriptionRequests = [],
    isPending: isSubscriptionRequestsPending,
    isFetching: isFetchingSubscriptionRequests,
    refetch: refetchSubscriptionRequests,
  } = useSubscriptionRequests();

  const {
    data: serviceOfferings = [],
    isPending: isServiceOfferingsPending,
    isFetching: isFetchingServiceOfferings,
    refetch: refetchServiceOfferings,
  } = useOrgServiceOfferings();

  const servicesObj = useMemo(() => {
    const servicesSet = new Set();
    return serviceOfferings.reduce((acc: any, offering: any) => {
      if (!servicesSet.has(offering.serviceId)) {
        servicesSet.add(offering.serviceId);
        acc[offering.serviceId] = offering;
      }
      return acc;
    }, {});
  }, [serviceOfferings]);

  const serviceOfferingsObj = useMemo(() => {
    return serviceOfferings.reduce((acc: any, offering: any) => {
      if (acc[offering.serviceId]) {
        acc[offering.serviceId][offering.productTierID] = offering;
      } else {
        acc[offering.serviceId] = {
          [offering.productTierID]: offering,
        };
      }
      return acc;
    }, {});
  }, [serviceOfferings]);

  const subscriptionsObj = useMemo(() => {
    return subscriptions.reduce((acc: any, subscription: any) => {
      acc[subscription.id] = subscription;
      return acc;
    }, {});
  }, [subscriptions]);

  if (!isFetchingServiceOfferings && serviceOfferings.length === 0) {
    return (
      <div className="flex flex-col" style={{ minHeight: "100vh" }}>
        <Navbar />
        <NoServiceFoundUI text="No Products Found" showMessage />
      </div>
    );
  }

  return (
    <GlobalDataContext.Provider
      value={{
        subscriptions,
        isSubscriptionsPending,
        isFetchingSubscriptions,
        refetchSubscriptions,

        subscriptionRequests,
        isSubscriptionRequestsPending,
        isFetchingSubscriptionRequests,
        refetchSubscriptionRequests,

        serviceOfferings,
        isServiceOfferingsPending,
        isFetchingServiceOfferings,
        refetchServiceOfferings,

        serviceOfferingsObj,
        subscriptionsObj,
        servicesObj,
      }}
    >
      {children}
    </GlobalDataContext.Provider>
  );
};

export default GlobalDataProvider;

import { keepPreviousData, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { getAllAuditEvents } from "src/api/event";
import useEnvironmentType from "src/hooks/useEnvironmentType";

type QueryParams = {
  startDate?: string;
  endDate?: string;
  eventSourceTypes?: string | string[];
  serviceID?: string;
  pageSize?: number;
};

const useAuditLogs = (queryParams: QueryParams = {}, queryOptions = {}) => {
  const queryClient = useQueryClient();
  const environmentType = useEnvironmentType();
  const { startDate, endDate, eventSourceTypes, serviceID, pageSize = 10 } = queryParams;

  const query = useInfiniteQuery({
    queryKey: ["audit-logs", startDate, endDate, eventSourceTypes, environmentType, serviceID],
    queryFn: async ({ pageParam }) => {
      const params: any = {};

      if (pageParam) {
        params.nextPageToken = pageParam;
      }
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }
      if (eventSourceTypes) {
        params.eventSourceTypes = eventSourceTypes;
      }
      if (environmentType) {
        params.environmentType = environmentType;
      }

      if (serviceID) params.serviceID = serviceID;

      const res = await getAllAuditEvents({
        pageSize,
        ...params,
      });

      res.data.events = res.data.events.map((event, index) => ({
        ...event,
        rowId: `${event.id}-${index}`,
      }));

      return res.data;
    },
    placeholderData: keepPreviousData,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
    ...queryOptions,
  });

  const refetchAndReset = async () => {
    queryClient.removeQueries({
      queryKey: ["audit-logs", startDate, endDate, eventSourceTypes, environmentType, serviceID],
    });
    return query.refetch();
  };

  return {
    ...query,
    refetch: refetchAndReset,
  };
};

export default useAuditLogs;

export declare const normalizeHarReplayUrl: (url: string) => string;

export type RecordedServiceOffering = {
  serviceId: string;
  serviceName: string;
};

export declare const readRecordedServiceOffering: (
  gzPath: string,
  serviceNamePrefix: string
) => RecordedServiceOffering;

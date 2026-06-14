import type { paths } from "./schema";

export type DescribeUserSuccessResponse =
  paths["/2022-09-01-00/user"]["get"]["responses"]["200"]["content"]["application/json"];

export type FeatureFlags = Record<string, boolean | undefined>;

export type ProviderUser = DescribeUserSuccessResponse & {
  featureFlags?: FeatureFlags;
};

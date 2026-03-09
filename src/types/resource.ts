import { components } from "./schema";

export type Resource = components["schemas"]["DescribeResourceResult"] & {
  /** Indicates if the resource supports custom DNS configuration */
  customDNS?: boolean;
};

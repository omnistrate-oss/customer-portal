import { components } from "./schema";

export type TierVersionSet = components["schemas"]["TierVersionSet"];

/** The fields `/api/version-sets` returns: what Release History shows. */
export type ReleaseSummary = Pick<TierVersionSet, "version" | "name" | "releasedAt" | "releaseNotes">;

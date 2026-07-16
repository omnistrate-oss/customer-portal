"use client";

import BackendConfigError from "./BackendConfigError";

// Catches errors thrown by the root layout (e.g. a failed provider bootstrap),
// which app/error.tsx cannot catch. Replaces Next's default full-page error.
const GlobalError = ({ error }: { error: Error & { digest?: string } }) => (
  <BackendConfigError detail={error?.message} />
);

export default GlobalError;

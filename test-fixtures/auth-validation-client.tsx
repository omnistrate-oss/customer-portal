import { useState } from "react";
import { createRoot } from "react-dom/client";

import axios from "src/axios";
import Button from "src/components/Button/Button";
import { Text } from "src/components/Typography/Typography";
import AxiosGlobalErrorHandler from "src/providers/AxiosGlobalErrorHandler";

import { AUTH_TEST_PLAN_ID, AUTH_TEST_SERVICE_ID } from "./auth-validation-data";

const AuthValidationClient = () => {
  const [status, setStatus] = useState("Not requested");

  const requestReleases = async () => {
    setStatus("Loading");
    try {
      await axios.get("/api/version-sets", {
        baseURL: "",
        params: { serviceId: AUTH_TEST_SERVICE_ID, productTierId: AUTH_TEST_PLAN_ID },
      });
      setStatus("Loaded releases");
    } catch {
      setStatus("Request failed");
    }
  };

  if (window.location.pathname === "/signin") return <Text>Sign in</Text>;

  return (
    <>
      <AxiosGlobalErrorHandler />
      <Text>Authentication validation</Text>
      <Button data-testid="auth-request-button" disabled={status === "Loading"} onClick={requestReleases}>
        Load releases
      </Button>
      <Text data-testid="auth-request-status">{status}</Text>
    </>
  );
};

const container = document.getElementById("root");
if (!container) throw new Error("Missing authentication test root");
createRoot(container).render(<AuthValidationClient />);

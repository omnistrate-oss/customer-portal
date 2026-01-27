import { useEffect, useState } from "react";

export function useLastLoginDetails() {
  const [email, setEmailState] = useState<string | null>("");
  const [loginMethod, setLoginMethodState] = useState<string | null>("");

  useEffect(() => {
    setEmailState(localStorage.getItem("lastLoginEmail"));
    setLoginMethodState(localStorage.getItem("lastLoginMethod"));
  }, []);

  function setEmail(email: string) {
    try {
      localStorage.setItem("lastLoginEmail", email);
      setEmailState(email);
    } catch (error) {
      console.error("Error setting last login email in localStorage:", error);
    }
  }

  //Password or some IDP
  function setLoginMethod(loginMethod: {
    //'Password' or IDP type eg 'Google', 'Github'
    methodType: "Password" | string;
    idpName?: string;
  }) {
    try {
      const stringified = JSON.stringify(loginMethod);
      localStorage.setItem("lastLoginMethod", stringified);
      setLoginMethodState(stringified);
    } catch (error) {
      console.error("Error setting last login method in localStorage:", error);
    }
  }

  return {
    email,
    loginMethod,
    setEmail,
    setLoginMethod,
  };
}

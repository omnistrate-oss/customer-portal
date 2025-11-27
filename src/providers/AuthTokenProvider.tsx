import { createContext, useContext, useState } from "react";
import Cookies from "js-cookie";

type AuthTokenContextType = {
  token?: string | undefined;
  handleSetToken?: (newToken: string | undefined) => void;
  handleRemoveToken?: () => void;
};

export const AuthTokenContext = createContext<AuthTokenContextType>({});

export const useAuthTokenContext = () => {
  const context = useContext(AuthTokenContext);
  return context;
};

const AuthTokenProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | undefined>(undefined);

  const handleSetToken = (newToken: string | undefined) => {
    setToken(newToken);
    Cookies.set("token", newToken, { sameSite: "Lax", secure: true });
  };

  const handleRemoveToken = () => {
    setToken(undefined);
  };

  return (
    <AuthTokenContext.Provider
      value={{
        token,
        handleSetToken,
        handleRemoveToken,
      }}
    >
      {children}
    </AuthTokenContext.Provider>
  );
};

export default AuthTokenProvider;

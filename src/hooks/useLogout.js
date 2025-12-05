import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useDispatch } from "react-redux";

import axios from "src/axios";
import { logoutBroadcastChannel } from "src/broadcastChannel";
import { initialiseUserData } from "src/slices/userDataSlice";

function useLogout() {
  const router = useRouter();
  const dispatch = useDispatch();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // remove token from cookies, remove other user data and redirect to signin
  function handleLogout() {
    Cookies.remove("token");
    localStorage.removeItem("paymentNotificationHidden");
    try {
      localStorage.removeItem("loggedInUsingSSO");
    } catch (error) {
      console.warn("Failed to clear SSO state:", error);
    }

    router.replace("/signin");
  }

  useEffect(() => {
    if (pathname === "/signin") {
      dispatch(initialiseUserData());
      queryClient.clear();
    }
  }, [pathname]);

  // make backend call and invalidate the token
  function logout() {
    axios
      .post("/logout")
      .catch((error) => {
        console.log("Logout request failed", error);
      })
      .finally(() => {
        handleLogout();
        //broadcasts the logout event to other windows and tabs to log them out
        if (logoutBroadcastChannel) {
          try {
            logoutBroadcastChannel.postMessage("logout");
          } catch (error) {
            console.error("Failed to post message on broadcast channel:", error);
          }
        }
      });
  }

  return { handleLogout, logout };
}

export default useLogout;

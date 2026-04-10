const { clearAuthCookie, clearRefreshCookie, getAuthToken } = require("src/server/utils/authCookie");

const baseDomain = process.env.NEXT_PUBLIC_BACKEND_BASE_DOMAIN || "https://api.omnistrate.cloud";

export default async function handleLogout(nextRequest, nextResponse) {
  if (nextRequest.method === "POST") {
    try {
      const authToken = getAuthToken(nextRequest);

      // Call backend logout to invalidate the token
      if (authToken) {
        await fetch(`${baseDomain}/2022-09-01-00/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }).catch((error) => {
          console.error("Backend logout request failed", error);
        });
      }
    } catch (error) {
      console.error("Error during logout", error);
    } finally {
      // Always clear both httpOnly cookies, even if backend call fails
      clearAuthCookie(nextResponse);
      clearRefreshCookie(nextResponse);
      nextResponse.status(200).send({ message: "Logged out" });
    }
  } else {
    nextResponse.setHeader("Allow", "POST");
    nextResponse.status(405).json({ message: "Method not allowed" });
  }
}

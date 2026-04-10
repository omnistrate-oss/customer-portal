const { clearAuthCookie, getAuthToken } = require("src/server/utils/authCookie");
const { baseDomain } = require("src/api/client");

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
      // Always clear the httpOnly cookie, even if backend call fails
      clearAuthCookie(nextResponse);
      nextResponse.status(200).send({ message: "Logged out" });
    }
  } else {
    nextResponse.status(404).json({ message: "Endpoint not found" });
  }
}

import { getCloudProviders } from "src/server/api/cloud-providers";
import { validateUserToken } from "src/server/utils/validateUserToken";

export default async function handleGetCloudProviders(nextRequest, nextResponse) {
  if (nextRequest.method === "GET") {
    const authentication = await validateUserToken(nextRequest);
    if (!authentication.ok) {
      return nextResponse.status(authentication.status).json({ message: authentication.message });
    }

    try {
      const response = await getCloudProviders();

      nextResponse.setHeader("Cache-Control", "private, no-store");
      nextResponse.status(200).send(response);
    } catch (error) {
      const defaultErrorMessage = "Something went wrong. Please retry";

      if (error.name === "ProviderAuthError" || error?.response?.status === undefined) {
        nextResponse.status(500).send({
          message: defaultErrorMessage,
        });
      } else {
        nextResponse.status(error.response?.status || 500).send({
          message: error.response?.data?.message || defaultErrorMessage,
        });
      }
    }
  } else {
    nextResponse.status(404).json({
      message: "Endpoint not found",
    });
  }
}

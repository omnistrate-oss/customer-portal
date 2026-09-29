import { getResources } from "src/server/api/resources";
import { validateUserToken } from "src/server/utils/validateUserToken";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const authentication = await validateUserToken(req);
  if (!authentication.ok) {
    return res.status(authentication.status).json({ message: authentication.message });
  }

  const { serviceId, productTierId, productTierVersion, isInjectedAccountConfig } = req.query;

  if (!serviceId || !productTierId) {
    return res.status(400).json({ message: "serviceId and productTierId are required" });
  }

  try {
    const resources = await getResources({
      serviceId,
      productTierId,
      productTierVersion: productTierVersion || "",
      isInjectedAccountConfig: isInjectedAccountConfig === "true",
    });

    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({ resources });
  } catch (error) {
    console.error("Error fetching resources:", error);

    if (error.name === "ProviderAuthError") {
      return res.status(500).json({ message: "Provider authentication failed" });
    }

    return res.status(500).json({ message: error.message || "Failed to fetch resources" });
  }
}

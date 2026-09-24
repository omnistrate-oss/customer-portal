import { getResources } from "src/server/api/resources";
import { requireProductTierAccess } from "src/server/utils/requireProductTierAccess";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const productTier = await requireProductTierAccess(req, res);
  if (!productTier) return;

  const { productTierVersion, isInjectedAccountConfig } = req.query;

  try {
    const resources = await getResources({
      ...productTier,
      productTierVersion: typeof productTierVersion === "string" ? productTierVersion : "",
      isInjectedAccountConfig: isInjectedAccountConfig === "true",
    });

    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({ resources });
  } catch (error) {
    console.error("Error fetching resources:", error);

    if (error.name === "ProviderAuthError") {
      return res.status(500).json({ message: "Provider authentication failed" });
    }

    return res.status(500).json({ message: "Failed to fetch resources" });
  }
}

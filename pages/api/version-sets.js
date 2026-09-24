import { getVersionSets } from "src/server/api/version-sets";
import { requireProductTierAccess } from "src/server/utils/requireProductTierAccess";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const productTier = await requireProductTierAccess(req, res);
  if (!productTier) return;

  try {
    const versionSets = await getVersionSets(productTier);

    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json(versionSets);
  } catch (error) {
    console.error("Error fetching version sets:", error);

    if (error.name === "ProviderAuthError") {
      return res.status(500).json({ message: "Provider authentication failed" });
    }

    return res.status(500).json({ message: "Failed to fetch version sets" });
  }
}

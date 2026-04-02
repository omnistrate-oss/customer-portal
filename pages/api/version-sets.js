import { getVersionSets } from "src/server/api/version-sets";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { serviceId, productTierId } = req.query;

  if (!serviceId || !productTierId) {
    return res.status(400).json({ message: "serviceId and productTierId are required" });
  }

  try {
    const versionSets = await getVersionSets({ serviceId, productTierId });
    return res.status(200).json({ tierVersionSets: versionSets });
  } catch (error) {
    console.error("Error fetching version sets:", error);

    if (error.name === "ProviderAuthError") {
      return res.status(500).json({ message: "Provider authentication failed" });
    }

    return res.status(500).json({ message: error.message || "Failed to fetch version sets" });
  }
}

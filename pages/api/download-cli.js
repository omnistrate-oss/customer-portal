import { baseDomain } from "src/axios";
import { getAuthToken } from "src/server/utils/authCookie";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { serviceId, serviceApiId } = req.query;

  if (!serviceId || !serviceApiId || typeof serviceId !== "string" || typeof serviceApiId !== "string") {
    return res.status(400).json({ message: "serviceId and serviceApiId are required" });
  }

  // Validate IDs to prevent path traversal
  const idPattern = /^[a-zA-Z0-9_-]+$/;
  if (!idPattern.test(serviceId) || !idPattern.test(serviceApiId)) {
    return res.status(400).json({ message: "Invalid serviceId or serviceApiId" });
  }

  const authToken = getAuthToken(req);
  if (!authToken) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const downloadURL = `${baseDomain}/2022-09-01-00/service/${serviceId}/service-api/${serviceApiId}/cli`;

  try {
    const response = await fetch(downloadURL, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Download failed");
      return res.status(response.status).json({ message: errorText });
    }

    // Forward content headers for binary download
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = response.headers.get("content-disposition");
    const contentLength = response.headers.get("content-length");

    res.setHeader("Content-Type", contentType);
    if (contentDisposition) {
      res.setHeader("Content-Disposition", contentDisposition);
    } else {
      res.setHeader("Content-Disposition", 'attachment; filename="cli"');
    }
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Error downloading CLI:", error?.message);
    return res.status(500).json({ message: "Failed to download CLI" });
  }
}

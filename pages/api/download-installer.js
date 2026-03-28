import { getInstallerDownload } from "src/server/api/installer-download";

const BACKEND_BASE_DOMAIN = process.env.NEXT_PUBLIC_BACKEND_BASE_DOMAIN || "https://api.omnistrate.dev";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { downloadPath } = req.body;

  if (!downloadPath || typeof downloadPath !== "string") {
    return res.status(400).json({ message: "downloadPath is required" });
  }

  // Ensure the path starts with / and doesn't contain protocol or host
  if (downloadPath.includes("://") || downloadPath.startsWith("//") || !downloadPath.startsWith("/")) {
    return res.status(400).json({ message: "Invalid download path" });
  }

  const downloadURL = BACKEND_BASE_DOMAIN + downloadPath;

  try {
    const response = await getInstallerDownload({
      downloadURL,
      authToken: req.headers.authorization || "",
    });

    // Forward content headers for binary download
    const contentType = response.headers["content-type"] || "application/octet-stream";
    const contentDisposition = response.headers["content-disposition"];
    const contentLength = response.headers["content-length"];

    res.setHeader("Content-Type", contentType);
    if (contentDisposition) {
      res.setHeader("Content-Disposition", contentDisposition);
    } else {
      res.setHeader("Content-Disposition", 'attachment; filename="installer"');
    }
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    return res.status(response.status || 200).send(Buffer.from(response.data));
  } catch (error) {
    console.error("Error downloading installer:", error?.message);
    const statusCode = error?.response?.status || 500;
    const errorMessage = error?.response?.data
      ? Buffer.from(error.response.data).toString()
      : error.message || "Failed to download installer";

    return res.status(statusCode).json({ message: errorMessage });
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
};

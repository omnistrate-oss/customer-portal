import { getInstallerDownload } from "src/server/api/installer-download";

const BACKEND_BASE_DOMAIN = process.env.NEXT_PUBLIC_BACKEND_BASE_DOMAIN || "https://api.omnistrate.dev";

export default async function handler(req, res) {
  // Support both GET (browser-managed download) and POST (legacy)
  const isGet = req.method === "GET";
  const isPost = req.method === "POST";

  if (!isGet && !isPost) {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // GET: downloadPath from query string; POST: from body
  const downloadPath = isGet ? req.query.downloadPath : req.body?.downloadPath;

  if (!downloadPath || typeof downloadPath !== "string") {
    return res.status(400).json({ message: "downloadPath is required" });
  }

  // Ensure the path starts with / and doesn't contain protocol or host
  if (downloadPath.includes("://") || downloadPath.startsWith("//") || !downloadPath.startsWith("/")) {
    return res.status(400).json({ message: "Invalid download path" });
  }

  // Auth: prefer Authorization header, fall back to "token" cookie
  const authToken = req.headers.authorization || (req.cookies?.token ? `Bearer ${req.cookies.token}` : "");

  const downloadURL = BACKEND_BASE_DOMAIN + downloadPath;

  try {
    const response = await getInstallerDownload({
      downloadURL,
      authToken,
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

    res.status(response.status || 200);

    // Stream the response directly to the client — no buffering
    await new Promise((resolve, reject) => {
      response.stream.pipe(res);
      response.stream.on("end", resolve);
      response.stream.on("error", reject);
    });
  } catch (error) {
    // If headers already sent (partial stream), we can only destroy the connection
    if (res.headersSent) {
      console.error("Stream error after headers sent:", error?.message);
      return res.end();
    }

    console.error("Error downloading installer:", error?.message);
    const statusCode = error?.response?.status || 500;

    let errorMessage = error.message || "Failed to download installer";
    if (error?.response?.data) {
      // In stream mode, error response data is a stream — read it
      try {
        const chunks = [];
        for await (const chunk of error.response.data) {
          chunks.push(chunk);
        }
        errorMessage = Buffer.concat(chunks).toString();
      } catch {
        // Fall back to the default error message
      }
    }

    return res.status(statusCode).json({ message: errorMessage });
  }
}

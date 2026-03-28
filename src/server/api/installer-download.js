const Axios = require("axios");

/**
 * Downloads the installer artifact as a stream from the given URL.
 * Uses responseType "stream" so bytes are piped directly to the client
 * without buffering the entire file in memory — much faster for large files.
 *
 * @param {object} params
 * @param {string} params.downloadURL - The full download URL (constructed server-side)
 * @param {string} params.authToken - The user's authorization header value
 * @returns {Promise<{stream: import("stream").Readable, headers: object, status: number}>}
 */
function getInstallerDownload(params = {}) {
  const { downloadURL, authToken } = params;

  return Axios.get(downloadURL, {
    headers: {
      Authorization: authToken || "",
    },
    responseType: "stream",
  })
    .then((response) => {
      return {
        stream: response.data, // Readable stream instead of a Buffer
        headers: response.headers,
        status: response.status,
      };
    })
    .catch((error) => {
      console.error("Installer download error:", error?.message);
      throw error;
    });
}

module.exports = {
  getInstallerDownload,
};

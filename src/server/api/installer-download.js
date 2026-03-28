const Axios = require("axios");

/**
 * Downloads the installer artifact from the given URL.
 * The URL is constructed server-side from the trusted base domain and path.
 *
 * @param {object} params
 * @param {string} params.downloadURL - The full download URL (constructed server-side)
 * @param {string} params.authToken - The user's authorization header value
 * @returns {Promise<{data: Buffer, headers: object, status: number}>}
 */
function getInstallerDownload(params = {}) {
  const { downloadURL, authToken } = params;

  return Axios.get(downloadURL, {
    headers: {
      Authorization: authToken || "",
    },
    responseType: "arraybuffer",
  })
    .then((response) => {
      return {
        data: response.data,
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

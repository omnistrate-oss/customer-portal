const Axios = require("axios");
const Cookies = require("js-cookie");

const baseDomain = process.env.NEXT_PUBLIC_BACKEND_BASE_DOMAIN || "https://api.omnistrate.dev";

const baseURL = baseDomain + "/2022-09-01-00";

const axios = Axios.create({
  baseURL,
  headers: {
    Authorization: "Bearer " + Cookies.get("token"),
  },
  ignoreGlobalErrorSnack: false,
});

module.exports = axios;
module.exports.baseURL = baseURL;

const withYaml = require("next-plugin-yaml");

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  async redirects() {
    return [
      {
        source: "/",
        destination: "/instances",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "accelerometer=(), camera=(), microphone=(), geolocation=(), gyroscope=(), magnetometer=(), usb=(), screen-wake-lock=()",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' https://www.googletagmanager.com https://accounts.google.com/gsi/client https://www.google.com https://www.gstatic.com 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net; worker-src 'self' https://www.google.com https://www.gstatic.com; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; connect-src *; img-src * data:; media-src *; frame-src *; object-src 'none'",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

module.exports = withYaml(nextConfig);

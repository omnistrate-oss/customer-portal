const next = require("next");
const express = require("express");
const path = require("path");
const nextConfig = require("./next.config");
const { startMailServiceCron } = require("./src/server/mail-service/mail-cron");
const verifyEnvrionmentVariables = require("./src/server/utils/verifyEnvironmentVariables");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = dev ? 3000 : 8080;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const expressApp = express();

app.prepare().then(async () => {
  //check if all required environement variables are available
  const { isVerified, envVariablesStatus } = await verifyEnvrionmentVariables();

  console.log("Environment variables status", envVariablesStatus);
  if (isVerified) {
    if (process.env.NODE_INDEX === undefined || process.env.NODE_INDEX === 0 || process.env.NODE_INDEX === "0") {
      //start the mail service cron job only if
      //a)NODE_INDEX environment variable is not present
      //b)NODE_INDEX environment variable === 0
      startMailServiceCron();
    }
  }
  expressApp.set("view engine", "ejs");
  expressApp.set("views", path.join(__dirname, "src/server/views"));
  const [{ headers: securityHeaders }] = await nextConfig.headers();
  expressApp.use(
    express.static(path.join(__dirname, "public"), {
      setHeaders: (response) => securityHeaders.forEach(({ key, value }) => response.setHeader(key, value)),
    })
  );
  expressApp.use(async (request, response) => {
    try {
      if (!isVerified && process.env.NODE_ENV === "development") {
        response.render("pages/setup-error", {
          envVariablesStatus,
        });
      }
      await handle(request, response);
    } catch {
      response.render("pages/error");
    }
  });

  expressApp.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});

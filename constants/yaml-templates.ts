import { randomBytes } from "crypto";
import { readFileSync } from "fs";

// Recordings keep service parameter defaults verbatim, so test instances get a throwaway password, never a secret.
const testInstancePassword = randomBytes(16).toString("hex");

const replaceAccountCredentials = (yaml: string) => {
  const accountId = process.env.AWS_ACCOUNT_ID;
  const gcpProjectId = process.env.GCP_PROJECT_ID;
  const gcpProjectNumber = process.env.GCP_PROJECT_NUMBER;

  if (!accountId || !gcpProjectId || !gcpProjectNumber) {
    throw new Error("Missing required environment variables for account credentials");
  }

  return yaml
    .replace(/{{AWS_ACCOUNT_ID}}/g, accountId)
    .replace(/{{GCP_PROJECT_ID}}/g, gcpProjectId)
    .replace(/{{GCP_PROJECT_NUMBER}}/g, gcpProjectNumber)
    .replace(/{{TEST_INSTANCE_PASSWORD}}/g, () => JSON.stringify(testInstancePassword));
};

export const yamlTemplates = {
  postgresProviderHostedDT: Buffer.from(
    replaceAccountCredentials(readFileSync(`${__dirname}/templates/postgres-provider-hosted-dt.yaml`, "utf8"))
  ).toString("base64"),
  postgresBYOADT: Buffer.from(
    replaceAccountCredentials(readFileSync(`${__dirname}/templates/postgres-byoa-dt.yaml`, "utf8"))
  ).toString("base64"),
  redisHelmProviderHosted: Buffer.from(
    replaceAccountCredentials(readFileSync(`${__dirname}/templates/redis-helm-provider-hosted.yaml`, "utf8"))
  ).toString("base64"),
};

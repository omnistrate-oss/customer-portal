import { get } from "node:https";

export const API_SPEC_URLS = {
  external: "https://api.omnistrate.dev/docs/external/",
};

const extractRedocDefinition = (content) => {
  const declaration = /\bconst\s+__redoc_definition\s*=\s*\{/.exec(content);
  if (!declaration) return null;

  const start = declaration.index + declaration[0].length - 1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < content.length; index += 1) {
    const character = content[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
    } else if (character === '"') {
      inString = true;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) return content.slice(start, index + 1);
    }
  }

  return "";
};

/** Reads a JSON specification or the JSON embedded in a Redoc documentation page without executing scripts. */
export const parseOpenAPIJSON = (content) => {
  let spec;
  try {
    spec = JSON.parse(extractRedocDefinition(content) ?? content);
  } catch {
    throw new Error("OpenAPI JSON was not found in the response");
  }

  if (
    !spec ||
    typeof spec !== "object" ||
    Array.isArray(spec) ||
    typeof spec.openapi !== "string" ||
    !spec.openapi.startsWith("3.") ||
    !spec.info ||
    typeof spec.info.title !== "string" ||
    typeof spec.info.version !== "string" ||
    !spec.paths ||
    typeof spec.paths !== "object" ||
    Array.isArray(spec.paths)
  ) {
    throw new Error("Response does not contain a valid OpenAPI 3 specification");
  }

  return JSON.stringify(spec, null, 2);
};

/** Downloads and validates the specification, including specifications embedded in Redoc pages. */
export const downloadOpenAPIJSON = (url) =>
  new Promise((resolve, reject) => {
    const request = get(url, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`OpenAPI download returned HTTP ${response.statusCode}`));
        return;
      }

      response.setEncoding("utf8");
      let content = "";
      response.on("data", (chunk) => {
        content += chunk;
      });
      response.on("error", reject);
      response.on("end", () => {
        try {
          resolve(parseOpenAPIJSON(content));
        } catch (error) {
          reject(error);
        }
      });
    });

    const timeout = setTimeout(() => {
      request.destroy(new Error("OpenAPI download timed out after 30 seconds"));
    }, 30_000);
    request.on("close", () => clearTimeout(timeout));
    request.on("error", reject);
  });

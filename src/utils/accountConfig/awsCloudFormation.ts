/**
 * Derives AWS CLI equivalents of the CloudFormation quick-create URL issued for AWS account
 * onboarding. Setup parameters come from the URL; updates preserve deployed governance unless
 * saved governance values are supplied.
 */

const QUICK_CREATE_PARAM_PREFIX = "param_";

/** Characters needing no shell quoting. Excludes the comma so parameter values stay unambiguous. */
const SHELL_SAFE_VALUE = /^[A-Za-z0-9._:/=@+-]+$/;

const AWS_CONSOLE_HOST_REGION = /^https?:\/\/([a-z0-9-]+)\.console\.aws\.amazon\.com/i;

export type AwsCloudFormationStackParameter = {
  key: string;
  value: string;
};

export type AwsCloudFormationStackDetails = {
  region?: string;
  stackName: string;
  templateUrl: string;
  parameters: AwsCloudFormationStackParameter[];
};

export type AwsCloudFormationUpdateStackDetails = {
  region: string;
  stackId: string;
  stackName: string;
  parameters: AwsCloudFormationStackParameter[];
};

/**
 * Splits an `a=1&b=2` query string into decoded pairs. Split by hand rather than with
 * `URLSearchParams`, whose `+` → space rule would corrupt values; the backend also leaves some
 * values unencoded, so a failed decode means the value is already literal.
 */
const parseQueryPairs = (query: string): Map<string, string> => {
  const pairs = new Map<string, string>();

  for (const part of query.split("&")) {
    if (!part) continue;

    const separatorIndex = part.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = part.slice(0, separatorIndex);
    const rawValue = part.slice(separatorIndex + 1);

    let value = rawValue;
    try {
      value = decodeURIComponent(rawValue);
    } catch {
      value = rawValue;
    }

    pairs.set(key, value);
  }

  return pairs;
};

const getStackRegion = (consoleUrl: string): string | undefined => {
  const queryIndex = consoleUrl.indexOf("?");

  if (queryIndex !== -1) {
    const region = parseQueryPairs(consoleUrl.slice(queryIndex + 1)).get("region");
    if (region) return region;
  }

  return consoleUrl.match(AWS_CONSOLE_HOST_REGION)?.[1];
};

/**
 * Pulls stack name, template URL and parameters out of a quick-create console URL. Returns `null`
 * for anything else — a bare template URL carries no parameters, so no working command exists.
 */
export const parseAwsCloudFormationQuickCreateUrl = (
  cloudFormationUrl?: string | null
): AwsCloudFormationStackDetails | null => {
  if (!cloudFormationUrl) return null;

  const hashIndex = cloudFormationUrl.indexOf("#");
  if (hashIndex === -1) return null;

  const fragment = cloudFormationUrl.slice(hashIndex + 1);
  const fragmentQueryIndex = fragment.indexOf("?");
  if (fragmentQueryIndex === -1) return null;

  const fragmentParams = parseQueryPairs(fragment.slice(fragmentQueryIndex + 1));

  const templateUrl = fragmentParams.get("templateURL");
  const stackName = fragmentParams.get("stackName");
  if (!templateUrl || !stackName) return null;

  const parameters = Array.from(fragmentParams.entries())
    .filter(([key]) => key.startsWith(QUICK_CREATE_PARAM_PREFIX))
    .map(([key, value]) => ({ key: key.slice(QUICK_CREATE_PARAM_PREFIX.length), value }));

  return {
    region: getStackRegion(cloudFormationUrl.slice(0, hashIndex)),
    stackName,
    templateUrl,
    parameters,
  };
};

/** Whether CLI commands can be derived, and therefore whether the tabbed instructions render. */
export const hasAwsCloudFormationCliCommands = (cloudFormationUrl?: string | null): boolean =>
  parseAwsCloudFormationQuickCreateUrl(cloudFormationUrl) !== null;

const quoteShellArg = (value: string): string =>
  SHELL_SAFE_VALUE.test(value) ? value : `'${value.replace(/'/g, `'\\''`)}'`;

/**
 * Renders one `--parameters` entry in the CLI's shorthand form. A comma inside a value is escaped
 * and quoted, otherwise the CLI reads it as the next key/value pair — `OIDCIssuerThumbprintList`
 * is a `CommaDelimitedList`, so a second thumbprint would silently truncate the parameter.
 *
 * Backslashes are escaped first: the CLI unescapes `\\` before it looks for separators, so a value
 * ending in a backslash would otherwise consume the `\` of the following `\,` and leave the comma
 * live — truncating the value at exactly the point the escaping meant to protect.
 *
 * @example formatStackParameter({ key: "OIDCIssuerThumbprintList", value: "aaa,bbb" })
 * // => "'ParameterKey=OIDCIssuerThumbprintList,ParameterValue=aaa\\,bbb'"
 */
const formatStackParameter = ({ key, value }: AwsCloudFormationStackParameter): string => {
  const escapedValue = value.replace(/\\/g, "\\\\").replace(/,/g, "\\,");
  const entry = `ParameterKey=${key},ParameterValue=${escapedValue}`;

  return SHELL_SAFE_VALUE.test(value) ? entry : `'${entry.replace(/'/g, `'\\''`)}'`;
};

/**
 * Builds stack commands from the quick-create details. `CAPABILITY_NAMED_IAM` is
 * mandatory: the template creates explicitly named IAM roles, and CloudFormation rejects the call
 * with `InsufficientCapabilities` without it.
 */
const buildAwsCloudFormationStackCommand = (
  operation: "create-stack" | "update-stack",
  stack: AwsCloudFormationStackDetails & { preservedParameters?: string[] }
): string => {
  const parameters = [
    ...stack.parameters.map(formatStackParameter),
    ...(stack.preservedParameters ?? []).map((key) => `ParameterKey=${key},UsePreviousValue=true`),
  ];
  const flags = [
    ...(stack.region ? [`--region ${quoteShellArg(stack.region)}`] : []),
    `--stack-name ${quoteShellArg(stack.stackName)}`,
    `--template-url ${quoteShellArg(stack.templateUrl)}`,
    "--capabilities CAPABILITY_NAMED_IAM",
    ...(parameters.length ? [`--parameters ${parameters.join(" \\\n    ")}`] : []),
  ];

  return `aws cloudformation ${operation} \\\n  ${flags.join(" \\\n  ")}`;
};

export const getAwsCloudFormationCreateStackCommand = (cloudFormationUrl?: string | null): string | null => {
  const stack = parseAwsCloudFormationQuickCreateUrl(cloudFormationUrl);
  return stack ? buildAwsCloudFormationStackCommand("create-stack", stack) : null;
};

export const parseAwsCloudFormationUpdateUrl = (
  cloudFormationUrl?: string | null
): AwsCloudFormationUpdateStackDetails | null => {
  try {
    const url = new URL(cloudFormationUrl ?? "");
    if (url.protocol !== "https:" || !url.hash.startsWith("#/stacks/update?")) return null;
    const params = parseQueryPairs(url.hash.slice(url.hash.indexOf("?") + 1));
    const stackId = params.get("stackId") ?? "";
    const stack = stackId.match(
      /^arn:(?:aws|aws-us-gov|aws-cn):cloudformation:([a-z0-9-]+):[0-9]{12}:stack\/([A-Za-z][A-Za-z0-9-]*)\/[A-Za-z0-9-]+$/
    );
    const region = stack?.[1];
    const stackName = stack?.[2];
    if (!region || !stackName) return null;
    const parameters = Array.from(params.entries())
      .filter(([key]) => key.startsWith(QUICK_CREATE_PARAM_PREFIX))
      .map(([key, value]) => ({ key: key.slice(QUICK_CREATE_PARAM_PREFIX.length), value }));
    if (parameters.some(({ key }) => !/^[A-Za-z][A-Za-z0-9]*$/.test(key))) return null;
    return { region, stackId, stackName, parameters };
  } catch {
    return null;
  }
};

/** Converts AWS Console setup links to the update flow while preserving deployed governance settings. */
export const getAwsCloudFormationUpdateConsoleUrl = (cloudFormationUrl?: string | null): string | null => {
  try {
    const url = new URL(cloudFormationUrl ?? "");
    if (url.protocol !== "https:" || !/^(?:[a-z0-9-]+\.)?console\.aws\.amazon\.com$/.test(url.hostname)) return null;

    if (url.hash.startsWith("#/stacks/quickcreate?")) {
      const stack = parseAwsCloudFormationQuickCreateUrl(cloudFormationUrl);
      if (!stack) return null;
      const params = new URLSearchParams({ stackId: stack.stackName, templateURL: stack.templateUrl });
      const preservedParameters = new Set([
        "AccountAction",
        "AgentInfrastructureMutationEnabled",
        "K8sDebugAccessEnabled",
      ]);
      for (const { key, value } of stack.parameters) {
        if (!preservedParameters.has(key)) params.set(`${QUICK_CREATE_PARAM_PREFIX}${key}`, value);
      }
      url.hash = `/stacks/update?${params.toString()}`;
    }

    if (!url.hash.startsWith("#/stacks/update?")) return null;
    const params = parseQueryPairs(url.hash.slice(url.hash.indexOf("?") + 1));
    const stackId = params.get("stackId") ?? "";
    if (!/^[A-Za-z][A-Za-z0-9-]*$/.test(stackId) && !parseAwsCloudFormationUpdateUrl(url.toString())) return null;
    const templateUrl = params.get("templateURL");
    if (templateUrl && new URL(templateUrl).protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
};

/**
 * Converts the full onboarding URL into an update command using the create command's formatter.
 * Saved parameters override URL values and appear once at the end of the parameter list.
 * Example: onboarding URL + saved connected=false → update-stack with AccountAction=Disconnect.
 */
export const getAwsCloudFormationUpdateStackCommand = (
  cloudFormationUrl?: string | null,
  cloudFormationCreateUrl?: string | null,
  savedParameters: AwsCloudFormationStackParameter[] = []
): string | null => {
  const sourceUrl = cloudFormationCreateUrl ?? cloudFormationUrl;
  const stack = parseAwsCloudFormationQuickCreateUrl(sourceUrl);
  if (!stack || !stack.parameters.length) return null;
  try {
    if (new URL(sourceUrl ?? "").protocol !== "https:" || new URL(stack.templateUrl).protocol !== "https:") return null;
  } catch {
    return null;
  }
  const verifiedStack = parseAwsCloudFormationUpdateUrl(cloudFormationUrl);
  if (verifiedStack && verifiedStack.stackName !== stack.stackName) return null;
  const supplied = savedParameters.length ? savedParameters : (verifiedStack?.parameters ?? []);
  const requested = Array.from(new Map(supplied.map(({ key, value }) => [key, value])), ([key, value]) => ({
    key,
    value,
  }));
  const preservedParameters = supplied.length
    ? []
    : ["AccountAction", "AgentInfrastructureMutationEnabled", "K8sDebugAccessEnabled"];
  const overriddenKeys = new Set([...requested.map(({ key }) => key), ...preservedParameters]);
  const parameters = [...stack.parameters.filter(({ key }) => !overriddenKeys.has(key)), ...requested];
  if (parameters.some(({ key }) => !/^[A-Za-z][A-Za-z0-9]*$/.test(key))) return null;
  return buildAwsCloudFormationStackCommand("update-stack", {
    ...stack,
    stackName: verifiedStack?.stackId ?? stack.stackName,
    region: verifiedStack?.region ?? stack.region,
    parameters,
    preservedParameters,
  });
};

/**
 * Builds the `delete-stack` equivalent of the console offboarding step. The stack name is read off
 * the URL, never assumed — onboarding URLs ship with both `AccountConfigSetup` and
 * `OmnistrateAccountConfigSetup`, and a wrong guess deletes nothing while reporting success.
 */
export const getAwsCloudFormationDeleteStackCommand = (cloudFormationUrl?: string | null): string | null => {
  const stack = parseAwsCloudFormationQuickCreateUrl(cloudFormationUrl);
  if (!stack) return null;

  const flags = [
    ...(stack.region ? [`--region ${quoteShellArg(stack.region)}`] : []),
    `--stack-name ${quoteShellArg(stack.stackName)}`,
  ];

  return `aws cloudformation delete-stack ${flags.join(" ")}`;
};

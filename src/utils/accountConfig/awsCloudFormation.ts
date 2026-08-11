/**
 * Derives AWS CLI equivalents of the CloudFormation quick-create URL issued for AWS account
 * onboarding. Everything is read off the URL so the command and the console link cannot drift.
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
 * @example formatStackParameter({ key: "OIDCIssuerThumbprintList", value: "aaa,bbb" })
 * // => "'ParameterKey=OIDCIssuerThumbprintList,ParameterValue=aaa\\,bbb'"
 */
const formatStackParameter = ({ key, value }: AwsCloudFormationStackParameter): string => {
  const entry = `ParameterKey=${key},ParameterValue=${value.replace(/,/g, "\\,")}`;

  return SHELL_SAFE_VALUE.test(value) ? entry : `'${entry.replace(/'/g, `'\\''`)}'`;
};

/**
 * Builds the `create-stack` equivalent of the quick-create link. `CAPABILITY_NAMED_IAM` is
 * mandatory: the template creates explicitly named IAM roles, and CloudFormation rejects the call
 * with `InsufficientCapabilities` without it.
 */
export const getAwsCloudFormationCreateStackCommand = (cloudFormationUrl?: string | null): string | null => {
  const stack = parseAwsCloudFormationQuickCreateUrl(cloudFormationUrl);
  if (!stack) return null;

  const flags = [
    ...(stack.region ? [`--region ${quoteShellArg(stack.region)}`] : []),
    `--stack-name ${quoteShellArg(stack.stackName)}`,
    `--template-url ${quoteShellArg(stack.templateUrl)}`,
    "--capabilities CAPABILITY_NAMED_IAM",
    ...(stack.parameters.length
      ? [`--parameters ${stack.parameters.map(formatStackParameter).join(" \\\n    ")}`]
      : []),
  ];

  return `aws cloudformation create-stack \\\n  ${flags.join(" \\\n  ")}`;
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

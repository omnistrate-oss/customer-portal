/**
 * ESLint 8 config.
 *
 * Guardrails are named groups of no-restricted-imports / no-restricted-syntax entries whose
 * messages start with the guardrail name, e.g. "[no-raw-mui] Use ...". eslintrc can't host a
 * local plugin, so files that a guardrail doesn't apply to (by directory, or by allowlist in
 * eslint.migration-allowlists.cjs) get an override carrying the remaining guardrails.
 */
const { execFileSync } = require("child_process");

const { guardrailAllowlists } = require("./eslint.migration-allowlists.cjs");

const APP_DIRS = ["src/", "app/", "pages/", "components/", "lib/", "constants/"];
const APP_FILES = APP_DIRS.map((dir) => `${dir}**/*.{js,jsx,ts,tsx}`);
const SHARED_COMPONENT_DIRS = ["src/components/", "components/"];
const SKILL_HINT = "See .agents/skills/ui-and-styling/SKILL.md.";
// Override `files` are globs; escape paths such as app/(dashboard)/[id]/page.tsx to match them literally.
const escapeGlob = (file) => file.replace(/[()[\]{}*?!+@]/g, "\\$&");

const testOnlyImportRestrictions = {
  paths: [
    {
      name: "@playwright/test",
      message: "Production code must not import Playwright. Keep browser-test dependencies in test-only modules.",
    },
  ],
  patterns: [
    {
      group: [
        "page-objects/**",
        "tests/**",
        "test-fixtures/**",
        "test-utils/**",
        "playwright/**",
        "**/page-objects/**",
        "**/tests/**",
        "**/test-fixtures/**",
        "**/test-utils/**",
        "**/playwright/**",
      ],
      message: "Production code must import shared contracts from src/ instead of test-only directories.",
    },
  ],
};

const muiWrappers = {
  Button: "Button from src/components/Button/Button",
  TextField: "TextField from src/components/FormElementsv2/TextField/TextField",
  Select: "Select from src/components/FormElementsv2/Select/Select",
  MenuItem: "MenuItem from src/components/FormElementsv2/MenuItem/MenuItem",
  Menu: "Menu from src/components/Menu/Menu",
  Tooltip: "Tooltip from src/components/Tooltip/Tooltip",
  Typography: "Text from src/components/Typography/Typography",
  Chip: "Chip from src/components/Chip/Chip (StatusChip for statuses)",
  Tabs: "Tabs from src/components/Tab/Tab",
  Tab: "Tab from src/components/Tab/Tab",
  Checkbox: "Checkbox from src/components/Checkbox/Checkbox",
  Switch: "Switch from src/components/Switch/Switch",
  CircularProgress:
    "CircularProgress from src/components/CircularProgress/CircularProgress (LoadingSpinner for a page)",
  LinearProgress: "LinearProgress from src/components/LinearProgress/LinearProgress",
  Drawer: "FullScreenDrawer from app/(dashboard)/components/FullScreenDrawer/FullScreenDrawer",
};

const LONG_HEX = "/#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?\\b/";
const FONT_PROPS = "/^(fontSize|fontWeight|lineHeight)$/";
const HEX_MESSAGE = `[no-hex-colors] Use the theme (theme.palette, the colors export in src/themeConfig.ts) instead of a hex color; the brand color comes only from theme.palette.primary. ${SKILL_HINT}`;
const FONT_MESSAGE = `[no-text-font-override] Use the Text size/weight props instead of overriding fontSize, fontWeight or lineHeight. ${SKILL_HINT}`;
const FETCH_MESSAGE =
  "[no-raw-fetch] Call the API through $api (src/api/query.ts). See .agents/skills/data-fetching/SKILL.md.";
const YUP_MESSAGE =
  "[formik-requires-yup] Formik forms need a Yup validationSchema. See .agents/skills/forms/SKILL.md.";
const MUTATE_MESSAGE =
  "[no-mutate-in-effect] Trigger mutations from event handlers, not from effects. See .agents/skills/data-fetching/SKILL.md.";

/** Each guardrail: its import and/or syntax entries, and the files it never applies to. */
const guardrails = {
  "no-raw-mui": {
    exempt: (file) => SHARED_COMPONENT_DIRS.some((dir) => file.startsWith(dir)),
    imports: {
      // ESLint 8 keeps only one entry per module name, so one entry carries every mapping.
      paths: [
        {
          name: "@mui/material",
          importNames: Object.keys(muiWrappers),
          message: `[no-raw-mui] Use the wrapper instead: ${Object.entries(muiWrappers)
            .map(([name, wrapper]) => `${name} -> ${wrapper}`)
            .join("; ")}. ${SKILL_HINT}`,
        },
      ],
      patterns: Object.entries(muiWrappers).map(([name, wrapper]) => ({
        group: [`@mui/material/${name}`],
        message: `[no-raw-mui] Use ${wrapper}. ${SKILL_HINT}`,
      })),
    },
  },
  "no-css-modules": {
    imports: {
      patterns: [
        {
          group: ["*.module.css", "*.module.scss"],
          message: `[no-css-modules] Style with sx, styled() and theme tokens. ${SKILL_HINT}`,
        },
      ],
    },
  },
  "no-auth-shell-components": {
    exempt: (file) =>
      file.startsWith("app/(public)/") ||
      file === "app/not-found.tsx" ||
      file.startsWith("src/components/NonDashboardComponents/"),
    imports: {
      patterns: [
        {
          group: ["**/NonDashboardComponents", "**/NonDashboardComponents/**"],
          message: "[no-auth-shell-components] NonDashboardComponents belong to the signed-out pages in app/(public)/.",
        },
      ],
    },
  },
  "no-react-icons": {
    imports: {
      patterns: [
        {
          group: ["react-icons", "react-icons/*"],
          message:
            "[no-react-icons] Add the SVG to src/icons/svg/ and run yarn icons:build. See .agents/skills/icons/SKILL.md.",
        },
      ],
    },
  },
  "no-axios": {
    exempt: (file) => file === "src/axios.js",
    imports: {
      paths: [
        {
          name: "axios",
          message: "[no-axios] Use $api from src/api/query.ts. See .agents/skills/data-fetching/SKILL.md.",
        },
      ],
      patterns: [
        {
          group: ["**/axios", "src/axios"],
          message: "[no-axios] Use $api from src/api/query.ts. See .agents/skills/data-fetching/SKILL.md.",
        },
      ],
    },
  },
  "no-hex-colors": {
    exempt: (file) =>
      file.startsWith("src/icons/") ||
      file.startsWith("src/components/Icons/") ||
      file.startsWith("src/constants/statusChipStyles/") ||
      file === "src/themeConfig.ts" ||
      file === "src/providerConfig.js",
    syntax: [
      { selector: "Literal[value=/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4})$/]", message: HEX_MESSAGE },
      { selector: `Literal[value=${LONG_HEX}]`, message: HEX_MESSAGE },
      { selector: `TemplateElement[value.raw=${LONG_HEX}]`, message: HEX_MESSAGE },
    ],
  },
  "no-text-font-override": {
    syntax: [
      {
        selector: `JSXOpeningElement[name.name='Text'] > JSXAttribute[name.name='sx'] Property[key.name=${FONT_PROPS}]`,
        message: FONT_MESSAGE,
      },
      {
        selector: `JSXOpeningElement[name.name='Text'] > JSXAttribute[name.name='sx'] Property[key.value=${FONT_PROPS}]`,
        message: FONT_MESSAGE,
      },
      {
        selector: `JSXOpeningElement[name.name='Text'] > JSXAttribute[name.name=${FONT_PROPS}]`,
        message: FONT_MESSAGE,
      },
    ],
  },
  "no-raw-fetch": {
    exempt: (file) => file.startsWith("src/api/") || file.startsWith("pages/api/"),
    syntax: [
      { selector: "CallExpression[callee.name='fetch']", message: FETCH_MESSAGE },
      {
        selector: "CallExpression[callee.object.name=/^(window|globalThis)$/][callee.property.name='fetch']",
        message: FETCH_MESSAGE,
      },
    ],
  },
  "formik-requires-yup": {
    syntax: [
      {
        selector:
          "CallExpression[callee.name='useFormik'] > ObjectExpression:not(:has(> Property[key.name='validationSchema'])):not(:has(> SpreadElement))",
        message: YUP_MESSAGE,
      },
      {
        selector:
          "JSXOpeningElement[name.name='Formik']:not(:has(> JSXAttribute[name.name='validationSchema'])):not(:has(> JSXSpreadAttribute))",
        message: YUP_MESSAGE,
      },
    ],
  },
  "no-mutate-in-effect": {
    syntax: [
      {
        selector:
          "CallExpression[callee.name=/^use(Layout)?Effect$/] CallExpression[callee.property.name=/^(mutate|mutateAsync)$/]",
        message: MUTATE_MESSAGE,
      },
      {
        selector:
          "CallExpression[callee.name=/^use(Layout)?Effect$/] CallExpression[callee.name=/^(mutate|mutateAsync)$/]",
        message: MUTATE_MESSAGE,
      },
    ],
  },
};

const TEST_DIRS = ["tests/", "test-fixtures/", "test-utils/", "page-objects/"];
const TEST_FILES = TEST_DIRS.map((dir) => `${dir}**/*.{js,jsx,ts,tsx}`);
const isSpec = (file) => /^tests\/.*\.spec\.ts$/.test(file);

const testGuardrails = {
  "no-focused-tests": {
    syntax: [
      {
        selector: "CallExpression > MemberExpression.callee[property.name='only']",
        message: "[no-focused-tests] Remove .only before committing.",
      },
    ],
  },
  "no-wait-for-timeout": {
    syntax: [
      {
        selector: "CallExpression[callee.property.name='waitForTimeout']",
        message:
          "[no-wait-for-timeout] Wait for a condition (expect(...).toBeVisible(), waitForResponse) instead of a fixed timeout.",
      },
    ],
  },
  "no-playwright-test-import": {
    exempt: (file) => !isSpec(file),
    imports: {
      paths: [
        {
          name: "@playwright/test",
          importNames: ["test", "expect", "default"],
          message:
            "[no-playwright-test-import] Import test and expect from test-fixtures/har-test so HAR record/replay applies.",
        },
      ],
    },
  },
};

/** Builds the two core rules from the named guardrails, on top of the base import restrictions. */
const guardrailRules = (set, names, base = { paths: [], patterns: [] }) => {
  const active = names.map((name) => set[name]);
  return {
    "no-restricted-imports": [
      "error",
      {
        paths: [...base.paths, ...active.flatMap((guardrail) => guardrail.imports?.paths ?? [])],
        patterns: [...base.patterns, ...active.flatMap((guardrail) => guardrail.imports?.patterns ?? [])],
      },
    ],
    "no-restricted-syntax": ["error", ...active.flatMap((guardrail) => guardrail.syntax ?? [])],
  };
};

/**
 * Groups every existing file under `dirs` by the guardrails it is exempt from, and returns one
 * override per group. Files that aren't exempt from anything are covered by the glob override.
 */
const exemptionOverrides = (set, dirs, base) => {
  const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", ...dirs], {
    encoding: "utf8",
  })
    .split("\n")
    .filter((file) => /\.(js|jsx|ts|tsx)$/.test(file));
  const groups = new Map();
  for (const file of files) {
    const exempt = Object.keys(set).filter(
      (name) => set[name].exempt?.(file) || guardrailAllowlists[name]?.includes(file)
    );
    if (exempt.length === 0) continue;
    const key = exempt.join(",");
    groups.set(key, [...(groups.get(key) ?? []), file]);
  }
  return [...groups].map(([key, groupFiles]) => ({
    files: groupFiles.map(escapeGlob),
    rules: guardrailRules(
      set,
      Object.keys(set).filter((name) => !key.split(",").includes(name)),
      base
    ),
  }));
};

// Plain ESLint rules keep their own IDs; their allowlists switch them off per file.
const ruleAllowlistOverrides = Object.entries(guardrailAllowlists)
  .filter(([rule, files]) => !guardrails[rule] && !testGuardrails[rule] && files.length > 0)
  .map(([rule, files]) => ({ files: files.map(escapeGlob), rules: { [rule]: "off" } }));

module.exports = {
  env: {
    node: true,
    es6: true,
  },
  ignorePatterns: [
    "node_modules/*",
    "schema.ts",
    ".next/*",
    "out/*",
    "coverage/*",
    "test-results/*",
    "playwright-report/*",
    "next-env.d.ts",
  ],
  plugins: ["react", "react-hooks", "import", "simple-import-sort"],
  extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  globals: {
    React: true,
  },
  parser: "@typescript-eslint/parser",
  rules: {
    "no-use-before-define": [
      "warn",
      {
        functions: false,
      },
    ],
    "simple-import-sort/imports": "warn",
    "simple-import-sort/exports": "warn",
    "no-undef": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-require-imports": "off",
    "no-unused-vars": "error",
    "react/jsx-uses-vars": "warn",
    "no-duplicate-imports": "error",
    "react/jsx-no-undef": "warn",
    "no-var": "warn",
    "prefer-const": "error",
    "react/self-closing-comp": "error",
    "react/no-unescaped-entities": "error",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-wrapper-object-types": "off",
  },
  overrides: [
    {
      files: [...APP_FILES, "server.js", "proxy.js", "next.config.js"],
      rules: {
        "no-restricted-imports": ["error", testOnlyImportRestrictions],
      },
    },
    {
      files: APP_FILES,
      rules: {
        ...guardrailRules(guardrails, Object.keys(guardrails), testOnlyImportRestrictions),
        "react/forbid-elements": [
          "error",
          {
            forbid: [
              { element: "button", message: `Use Button from src/components/Button/Button. ${SKILL_HINT}` },
              {
                element: "select",
                message: `Use Select from src/components/FormElementsv2/Select/Select. ${SKILL_HINT}`,
              },
              {
                element: "input",
                message: `Use the TextField, Checkbox, Switch or Radio wrappers in src/components/. ${SKILL_HINT}`,
              },
              {
                element: "textarea",
                message: `Use a multiline TextField from src/components/FormElementsv2/TextField/TextField. ${SKILL_HINT}`,
              },
              { element: "table", message: `Use DataTable from src/components/DataTable/DataTable. ${SKILL_HINT}` },
            ],
          },
        ],
        "react/jsx-no-leaked-render": ["error", { validStrategies: ["coerce", "ternary"] }],
        "react/function-component-definition": [
          "error",
          { namedComponents: "arrow-function", unnamedComponents: "arrow-function" },
        ],
        "react/no-danger": ["error", { customComponentNames: ["*"] }],
        "react-hooks/set-state-in-effect": "error",
        "no-console": ["error", { allow: ["warn", "error"] }],
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      },
    },
    {
      files: SHARED_COMPONENT_DIRS.map((dir) => `${dir}**`),
      rules: { "react/forbid-elements": "off" },
    },
    ...exemptionOverrides(guardrails, APP_DIRS, testOnlyImportRestrictions),
    {
      // Playwright fixtures take a callback parameter named `use`, which
      // react-hooks/rules-of-hooks misreads as React's `use` hook.
      files: [...TEST_FILES, "playwright/**", "playwright.config.ts"],
      rules: { "react-hooks/rules-of-hooks": "off" },
    },
    {
      files: TEST_FILES,
      rules: guardrailRules(
        testGuardrails,
        Object.keys(testGuardrails).filter((name) => name !== "no-playwright-test-import")
      ),
    },
    {
      files: ["tests/**/*.spec.ts"],
      rules: guardrailRules(testGuardrails, Object.keys(testGuardrails)),
    },
    ...exemptionOverrides(testGuardrails, TEST_DIRS),
    ...ruleAllowlistOverrides,
    {
      files: ["**/*.js", "**/*.ts", "**/*.tsx", "**/*.jsx"],
      rules: {
        "simple-import-sort/imports": [
          "warn",
          {
            groups: [
              // `react` first, `next` second, then packages starting with a character
              ["^react$", "^next", "^@", "^[a-z]"],
              // Absolute imports starting with 'src/'
              ["^@/", "^src/", "^components/", "^hooks/", "^utils/"],
              // Public imports
              ["^public/"],
              // Imports starting with `../`
              ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
              // Imports starting with `./`
              ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
              // Style imports
              ["^.+\\.s?css$"],
              // Side effect imports
              ["^\\u0000"],
            ],
          },
        ],
      },
    },
  ],
};

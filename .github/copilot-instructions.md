# Copilot PR Review Agent Guidelines

## Overview

This document provides Copilot PR review agent with comprehensive context and instructions for automated code review in the Omnistrate SaaSBuilder project. As a PR reviewer, you should identify issues, provide specific suggestions, and ensure code quality consistency.

## Review Instructions for Copilot Agent

### Your Role

You are an automated code reviewer for the Omnistrate SaaSBuilder project. Your responsibilities:

1. **Identify Issues**: Flag problems based on established patterns
2. **Provide Solutions**: Offer specific, actionable fix suggestions
3. **Ensure Consistency**: Maintain codebase standards and conventions
4. **Educate Developers**: Explain why changes are needed
5. **Prioritize Issues**: Focus on high-impact problems first

### Review Approach

- **Be Constructive**: Provide helpful suggestions, not just criticism
- **Be Specific**: Include code examples in your suggestions
- **Be Contextual**: Consider the broader impact of changes
- **Be Educational**: Explain the reasoning behind recommendations

## Code Review Standards

### 1. TypeScript Implementation

#### Type Safety Requirements

- **No `any` types**: Use proper type definitions or `unknown` when appropriate
- **Null safety**: Implement proper null and undefined checks using optional chaining (`?.`) and nullish coalescing (`??`)
- **Type guards**: Use type guards and type assertions correctly
- **Generic types**: Use appropriately for reusable components and functions
- **Enums**: Use proper enum usage instead of string literals where applicable
- **Strict mode**: Ensure compliance with `strict` TypeScript configuration

#### Required Type Definitions

- **Components**: All React components must have defined props interfaces/types
- **Hooks**: Custom hooks must have proper return type definitions and parameter types
- **API Layer**: All API calls (Axios, TanStack Query, OpenAPI Fetch) must have defined request/response types
- **Forms**: Form validation, submission handlers, and form data must be properly typed
- **State Management**: Redux slices, context providers, and state must have defined types
- **Utility Functions**: All utility functions must have proper input/output types

#### Examples

```typescript
// ❌ Flag this - missing types and null checks
const Component = (props) => {
  const data = props.data.map(item => item.name);
  return <div>{data}</div>;
};

// ✅ Suggest this instead
interface ComponentProps {
  data: Array<{ name: string; id: string }>;
}

const Component: React.FC<ComponentProps> = ({ data }) => {
  const names = data?.map(item => item.name) ?? [];
  return <div>{names.join(', ')}</div>;
};
```

```typescript
// ❌ Flag this - untyped API call
const fetchUser = async (id) => {
  const response = await axios.get(`/api/users/${id}`);
  return response.data;
};

// ✅ Suggest this instead
interface User {
  id: string;
  name: string;
  email: string;
}

const fetchUser = async (id: string): Promise<User> => {
  const response = await axios.get<User>(`/api/users/${id}`);
  return response.data;
};
```

### 2. Testing Requirements

#### Coverage Standards

- **Required**: Every new feature must have either integration tests OR E2E tests (or both) to ensure the feature works correctly in realistic scenarios

#### General Testing Best Practices

- Use proper test structure (Arrange, Act, Assert)
- Mock external dependencies appropriately
- Test error scenarios and edge cases
- Ensure tests are deterministic and don't rely on external state
- Use meaningful test descriptions that explain what is being tested

#### Playwright E2E Testing Best Practices

- **Test Organization**: Use `test.describe()` for grouping related tests and `test.describe.configure({ mode: "serial" })` for dependent test sequences
- **Page Object Pattern**: Always use page objects for reusable UI interactions (see existing `page-objects/` directory)
- **Data Test IDs**: Use `getByTestId()` for reliable element selection instead of text-based selectors when possible
- **Wait Strategies**: Use appropriate wait strategies (`waitForLoadState("networkidle")`, `waitForResponse()`, `waitFor()`) instead of fixed timeouts
- **Environment Variables**: Always use environment variables for test data (emails, passwords, URLs)
- **State Management**: Use the GlobalStateManager for sharing data between tests
- **Authentication**: Leverage the user-setup.spec.ts pattern with `storageState` for authenticated test scenarios
- **API Integration**: Use API clients (`UserAPIClient`, `ProviderAPIClient`) for setup/teardown and data verification
- **Timeouts**: Configure appropriate timeouts for different test types (current: 12 minutes for E2E, 30 seconds for actions)

#### Test Examples

```typescript
// ❌ Flag this - missing tests for new feature
const calculatePricing = (plan: Plan, usage: Usage): number => {
  // Complex pricing logic
  return price;
};

// ✅ Suggest this instead - with accompanying tests
describe("calculatePricing", () => {
  it("should calculate correct price for basic plan", () => {
    const plan = { type: "basic", basePrice: 10 };
    const usage = { requests: 1000 };
    expect(calculatePricing(plan, usage)).toBe(10);
  });

  it("should handle null usage gracefully", () => {
    const plan = { type: "basic", basePrice: 10 };
    expect(() => calculatePricing(plan, null)).not.toThrow();
  });
});
```

### 3. Code Quality Standards

#### Console Log Statements and Debugging

- **Production Code Cleanliness**: Flag any console.log statements or debugging code left in production
- **Acceptable Debugging**: Only allow console statements for:
  - Error logging with proper error handling
  - Development-only debugging with environment checks
  - Intentional user-facing logs (rare cases)

```typescript
// ❌ Flag this - console statements left in code
const fetchData = async () => {
  console.log("Fetching data...");
  const response = await api.getData();
  console.log("Response:", response);
  return response;
};

// ✅ Suggest this instead
const fetchData = async () => {
  const response = await api.getData();
  return response;
};

// ✅ Or use proper logging for debugging in development
const fetchData = async () => {
  if (process.env.NODE_ENV === "development") {
    console.debug("Fetching data...");
  }
  const response = await api.getData();
  return response;
};
```

#### Form Validation Standards

- **Comprehensive Validation**: Ensure all forms have proper validation
- **Requirements**:
  - Client-side validation for immediate feedback
  - Server-side validation confirmation
  - Proper error message display
  - Accessibility compliance for form errors
  - Consistent validation patterns across forms

```typescript
// ❌ Flag this - missing validation
const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    // No validation before submission
    loginUser(email, password);
  };
};

// ✅ Suggest this instead
import * as Yup from "yup";

const validationSchema = Yup.object({
  email: Yup.string().email("Please enter a valid email address").required("Email is required"),
  password: Yup.string().min(8, "Password must be at least 8 characters").required("Password is required"),
});

const LoginForm = () => {
  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema,
    onSubmit: (values) => {
      loginUser(values.email, values.password);
    },
  });
};
```

#### Error Handling in Async Operations

- **Requirements**:
  - Try-catch blocks for all async operations
  - User-friendly error messages
  - Proper error state management
  - Error boundaries for React components
  - Logging errors for debugging

```typescript
// ❌ Flag this - missing error handling
const fetchUserData = async (userId: string) => {
  const response = await api.getUser(userId);
  return response.data;
};

// ✅ Suggest this instead
const fetchUserData = async (userId: string): Promise<User | null> => {
  try {
    const response = await api.getUser(userId);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    throw new Error("Unable to load user information");
  }
};

const Component = () => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      setError("");
      try {
        const userData = await fetchUserData("123");
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);
};
```

#### Utility Functions and Code Reuse

- **DRY Principle**: Flag duplicate logic that should use utility functions
- **Common Patterns to Extract**:
  - Date/time formatting
  - Data validation logic
  - API response processing
  - Error message formatting
  - Currency/number formatting

```typescript
// ❌ Flag this - duplicate date formatting logic
const Component1 = () => {
  const formattedDate = new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ✅ Suggest this instead - create utility function
// utils/dateUtils.ts
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Components use utility
const Component1 = () => {
  const formattedDate = formatDate(dateString);
};
```

#### Reusable UI Components

- **Component Reuse Principle**: Flag custom implementations when reusable components exist
- **Common Reusable Components**: Use existing components from `/src/components/`:
  - Button, TextField, Checkbox, Select, Radio, Switch
  - Dialog, Modal, Drawer, Accordion
  - DataTable, Pagination, SearchBar
  - LoadingSpinner, ErrorBoundary, Toast
  - Card, Chip, Badge, Avatar
  - FormField, FormSection, ValidationMessage

```typescript
// ❌ Flag this - duplicate button implementation
const CustomSubmitButton = styled('button')(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  padding: '12px 24px',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
}));

const Form = () => {
  return (
    <form>
      <CustomSubmitButton onClick={handleSubmit}>
        Submit
      </CustomSubmitButton>
    </form>
  );
};

// ✅ Suggest this instead - use existing Button component
import Button from 'src/components/Button/Button';

const Form = () => {
  return (
    <form>
      <Button
        variant="primary"
        onClick={handleSubmit}
        data-testid="form-submit-button"
      >
        Submit
      </Button>
    </form>
  );
};
```

```typescript
// ❌ Flag this - custom checkbox implementation
const CustomCheckbox = ({ checked, onChange, label }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ marginRight: '8px' }}
      />
      <span>{label}</span>
    </div>
  );
};

// ✅ Suggest this instead - use existing Checkbox component
import Checkbox from 'src/components/Checkbox/Checkbox';

const FormField = ({ checked, onChange, label }) => {
  return (
    <Checkbox
      checked={checked}
      onChange={onChange}
      label={label}
      data-testid="enable-feature-checkbox"
    />
  );
};
```

```typescript
// ❌ Flag this - custom select dropdown
const CustomSelect = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="custom-select">
      <div onClick={() => setIsOpen(!isOpen)}>
        {value || 'Select option'}
      </div>
      {isOpen && (
        <div className="options">
          {options.map(option => (
            <div key={option.value} onClick={() => onChange(option.value)}>
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ✅ Suggest this instead - use existing Select component
import Select from 'src/components/Select/Select';

const FormField = ({ options, value, onChange }) => {
  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Select option"
      data-testid="region-select"
    />
  );
};
```

#### Clean Code Practices

- **Unused Imports and Variables**: Flag any unused code
- **Code Documentation**: Require explanatory comments for complex algorithms
- **Naming Conventions**: Ensure consistent naming across files

```typescript
// ❌ Flag this - unused imports and variables
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { formatDate, calculateAge } from '../utils';

const UserProfile = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const userName = user.name;

  return (
    <Box>
      <Typography>{user.name}</Typography>
    </Box>
  );
};

// ✅ Suggest this instead - only necessary imports
import React from 'react';
import { Box, Typography } from '@mui/material';

const UserProfile = ({ user }) => {
  return (
    <Box>
      <Typography>{user.name}</Typography>
    </Box>
  );
};
```

### 4. Naming Conventions

#### Standards

- **Components**: PascalCase (UserProfile, DataTable)
- **Functions/Variables**: camelCase (getUserData, isLoading)
- **Constants**: UPPER_SNAKE_CASE (API_BASE_URL, MAX_RETRY_COUNT)
- **Files**: PascalCase for components (UserProfile.tsx), camelCase for utilities (userService.ts)
- **Interfaces/Types**: PascalCase with descriptive names (UserProfile, ApiResponse)

#### Data Test ID Patterns

- **Standards**:
  - Use kebab-case for all test IDs
  - Include context/component name
  - Be descriptive and unique
  - Follow hierarchical naming for nested elements

```typescript
// ❌ Flag this - inconsistent test ID patterns
<Button data-testid="submitBtn">Submit</Button>
<Button data-testid="cancel_button">Cancel</Button>
<Button data-testid="DeleteButton">Delete</Button>

// ✅ Suggest this instead - consistent kebab-case pattern
<Button data-testid="submit-button">Submit</Button>
<Button data-testid="cancel-button">Cancel</Button>
<Button data-testid="delete-button">Delete</Button>

// ✅ Use descriptive, hierarchical naming
<Form data-testid="user-profile-form">
  <TextField data-testid="user-profile-form-email-input" />
  <Button data-testid="user-profile-form-submit-button">Save</Button>
  <Button data-testid="user-profile-form-cancel-button">Cancel</Button>
</Form>
```

### 5. Content and Language Standards

#### English Syntax and Grammar Review

- **Text Content Areas to Review**:
  - Marketing copy and value propositions
  - Headlines, subheadings, and CTAs (Call-to-Actions)
  - Component text and labels
  - Error messages and notifications
  - Comments in code
  - Documentation strings
  - README files and documentation

#### Grammar and Syntax Checks

- Check for proper grammar, spelling, and punctuation
- Ensure consistent tone and voice across the application
- Verify proper capitalization and formatting (follow AP Style for headlines)
- Look for typos and misspellings
- Check for clarity and readability of user-facing messages
- Ensure proper use of active voice over passive voice
- Verify sentence structure and flow for marketing content

#### Content Standards

- Ensure professional and clear communication appropriate for enterprise B2B audience
- Maintain consistency with existing content style and brand voice
- Verify that technical terms are used correctly and consistently
- Check that abbreviations and acronyms are properly defined when first used
- Ensure marketing claims are clear, accurate, and not misleading
- Check for inclusive language and avoid jargon that may exclude audiences

#### Brand Name Restrictions

- **Flag "Omnistrate" in User-Facing Content**: The word "Omnistrate" should never appear in user-facing UI text, error messages, marketing copy, or any content visible to end users
- **Acceptable Usage**: "Omnistrate" is only acceptable in:
  - Code comments for internal documentation
  - Configuration files and environment variables
  - Internal API endpoints and service names
  - Developer documentation and README files
  - File paths and directory names
- **User-Facing Alternatives**: Use generic terms like "platform", "SaaS Builder", "the application", or context-appropriate alternatives

```jsx
// ❌ Flag this - "Omnistrate" visible to users
<h1>Welcome to Omnistrate SaaS Builder</h1>
<p>Omnistrate helps you build SaaS products</p>

// ✅ Suggest this instead
<h1>Welcome to SaaS Builder</h1>
<p>Our platform helps you build SaaS products</p>
```

#### Deprecated Terms (Flag for Replacement)

| Deprecated Term       | Correct Term               |
| --------------------- | -------------------------- |
| Service               | SaaS Product               |
| SaaS Offer            | SaaS Product               |
| Service Plan          | Plan                       |
| Service Plans         | Plans                      |
| Service Configuration | SaaS Product Configuration |
| Service Management    | SaaS Product Management    |
| Service Builder       | SaaS Product Builder       |
| Service Creation      | SaaS Product Creation      |
| Create Service        | Create SaaS Product        |
| Manage Service        | Manage SaaS Product        |
| Service Details       | SaaS Product Details       |
| Service Settings      | SaaS Product Settings      |
| Create SaaS Offer     | Create SaaS Product        |
| service name          | product name               |
| Service Component     | Resource                   |
| Service Provider      | SaaS Provider              |
| Service Blueprint     | Plan Blueprint             |
| Service Environment   | Environment                |
| Events                | Notifications              |
| Event                 | Notification               |
| Alarm                 | Alert                      |
| Alarms                | Alerts                     |
| Event Management      | Notification Management    |
| Event Center          | Notification Center        |
| Docker image          | Container image            |
| Docker images         | Container images           |
| Docker registry       | Container registry         |
| Docker build          | Container build            |
| Hosting Model         | Tenancy Type               |
| Hosting Models        | Tenancy Types              |
| Multi-tenant hosting  | Multi-tenant architecture  |
| Single-tenant hosting | Single-tenant architecture |

#### Content Examples

```typescript
// ❌ Flag this - grammar error
const errorMessage = "An error has occured while processing your request";

// ✅ Suggest this instead
const errorMessage = "An error has occurred while processing your request";
```

```jsx
// ❌ Flag this - inconsistent capitalization and weak CTA
<Button>get Started for free</Button>

// ✅ Suggest this instead
<Button>Get Started for Free</Button>
```

```jsx
// ❌ Flag this - deprecated terminology
<h2>Create Your Service</h2>

// ✅ Suggest this instead
<h2>Create Your SaaS Product</h2>
```

```jsx
// ❌ Flag this - inconsistent confirmation text and action
<Text>To confirm deletion type <b>unsubscribe</b> in the dialog below</Text>

// ✅ Suggest this instead
<Text>To confirm deletion type <b>deleteme</b> in the dialog below</Text>
```

### 6. Security and Privacy

This repository ships a customer-facing white-label SaaS portal that SaaS providers fork and re-deploy with their own branding and Omnistrate API endpoint. End customers sign in with passwords, manage cloud-deployed instances, and configure cloud accounts. That makes the portal one of the higher-value security targets in the project, and the rules below are non-negotiable.

#### Authentication and token handling

- **Auth tokens live in httpOnly cookies, never in `localStorage` or `sessionStorage`**. The two cookies of record are `omnistrate_token` (access, ~1 day, HttpOnly + SameSite=Lax, with `Secure` enabled in production) and `omnistrate_refresh_token` (refresh, ~7 days, HttpOnly + SameSite=Lax, with `Secure` enabled in production). The `Secure` flag is gated on `process.env.NODE_ENV === "production"` in `src/server/utils/authCookie.ts` so that local development over `http://localhost` works. The non-httpOnly `omnistrate_logged_in=true` flag is the only client-readable auth signal — do not extend it to carry secret values.
- **Flag any new `localStorage.setItem`, `sessionStorage.setItem`, `document.cookie =`, or in-memory long-lived store** that holds a JWT, bearer token, refresh token, OAuth code, or password. Tokens must never appear in `console.log`, error messages, analytics events, or query params.
- **Cookie defaults**: Any new auth cookie must inherit `HttpOnly`, `Secure` (in production), and an explicit `SameSite` attribute. Flag PRs that add cookies without all three.
- **Auth redirects**: After signin, IDP callback, or password reset, the post-login redirect target must be validated against an allowlist (same-origin paths only, no full URLs from query params). This is an open-redirect class bug — flag any `router.push(searchParams.get("next"))` style usage without validation.
- **Auth-exempt routes must match the real allowlists**. Do not rely on a hard-coded list in this document. The sources of truth are the Next.js middleware matcher in `proxy.js` (which excludes routes such as `/signin`, `/signup`, `/reset-password`, `/change-password`, `/idp-auth`, `/privacy-policy`, `/cookie-policy`, `/terms-of-use`, and several `/api/*` paths) and the backend non-protected endpoint allowlist in `src/utils/authUtils.ts`. Flag any PR that changes one allowlist without updating the other (and this guidance), or that bypasses auth for a new route without explicit security justification.

#### XSS and HTML injection

Because this is a white-label portal where **provider-supplied content** (organization name, description, logo URL, favicon URL, plan descriptions, support links, install instructions) is rendered to end customers, any path from provider config → DOM is a cross-tenant XSS vector if mishandled.

- **Sanitize all `dangerouslySetInnerHTML` with DOMPurify** (`dompurify` is already a dep). Current known sinks include plan descriptions, syntax-highlighted logs, and the GA bootstrap. Flag any new sink, any change that drops `DOMPurify.sanitize`, and any sink that renders provider-supplied or backend-supplied HTML without it. The GA bootstrap (a static template-literal string) is the only acceptable un-sanitized use.
- **Validate dynamic `href`, `src`, `action`, and `formAction` values**: Provider-supplied logo / favicon / privacy-policy / terms / support URLs must be checked for scheme — only allow `http`, `https`, `mailto`, and same-origin relative paths. Reject `javascript:`, `data:` (in navigation/script contexts), and `vbscript:`. Flag any place that renders `org.logoUrl` or `plan.descriptionHtml` directly without validation or sanitization.
- **No raw HTML in plan descriptions, error messages, or notification bodies** unless explicitly sanitized.

#### Sensitive data in client state

- Redux (`userDataSlice`, `genericSlice`), React Context, and React Query caches may hold user identifiers, org metadata, and UI state — but **must not hold** full tokens, passwords, OAuth codes, cloud credentials (AWS access keys, GCP service-account JSON, Azure secrets), reCAPTCHA tokens after submission, or unnecessary PII (phone numbers, addresses) beyond what the active view needs.
- Flag PRs that store backend responses containing secret material into Redux for "later use." Cloud-account credential entry forms must submit and forget — the form state should not be persisted across navigation, modals, or hydration.
- On logout, Redux state and any sensitive React Query caches must be cleared. Flag changes that skip or weaken the logout cleanup.

#### URL and query param hygiene

- Service IDs, instance IDs, and subscription IDs in URLs are acceptable (they're used for navigation). **Do not** put email addresses, raw customer IDs, tokens, signed URLs, password-reset tokens (beyond the dedicated `?token=` parameter on the reset-password page, which should be consumed and dropped immediately), or anything sensitive into query params that get captured by analytics or the `Referer` header.
- The `?token=` on `/reset-password` and similar one-time tokens must be: (a) consumed once and removed from the URL via `router.replace`, (b) never logged, (c) never sent in an analytics event.

#### Third-party scripts, SDKs, and CSP

- **Current third-party surface**: Google Analytics (`googletagmanager.com`), Google OAuth (`accounts.google.com`), Google reCAPTCHA (`google.com/recaptcha`). No PostHog, HubSpot, Intercom, or CRM SDKs are loaded by default — providers may add their own when they fork.
- **Any new `<script>` tag, `next/script` usage, or npm package making outbound network calls must be flagged** with: CSP impact, cookie-consent gating, data-exfiltration surface, and whether it should be opt-in for forks rather than enabled by default.
- **CSP in `next.config.js`** is currently permissive in places (`connect-src *`, `frame-src *`, and `script-src` already includes `'unsafe-eval'` and `'unsafe-inline'`). Flag any change that further relaxes CSP, prefer PRs that tighten these directives, and avoid expanding the use of `'unsafe-eval'` / `'unsafe-inline'`; where feasible, prefer tightening or removing them. New external script/connect/frame origins should be explicitly listed, not wildcarded.

#### Analytics, telemetry, and consent

- **GA4 (or any analytics SDK) must not capture PII**: no raw email, name, password fields, full URLs containing identifiers, or free-text user input. Cookie-consent manager defaults `analytics_storage` to denied — flag any change that grants storage by default or fires analytics before consent is granted in strict regions (EU/EEA/UK/US/CH).
- **End-customer identifiers** sent to any analytics platform must be hashed or pseudonymous, never raw email or org name. Free-text fields (search inputs, notes, descriptions) must never be captured as event parameters.

#### CORS and fetch behavior

- For client-side `fetch`, `axios`, and `openapi-fetch` calls: only set `credentials: "include"` / `withCredentials: true` for same-origin requests or the configured Omnistrate API base URL. Never send auth cookies or `Authorization` headers to third-party origins.
- On the server side (`/api/*` routes, middleware): do not respond with `Access-Control-Allow-Origin: *` together with `Access-Control-Allow-Credentials: true`, and do not echo the request `Origin` back without an allowlist check. The portal is intended to run on the provider's own domain — CORS should reflect that, not be globally open.

#### Form handling

- **Server-side is the security boundary**: Yup/Formik validation is for UX. Backend endpoints must independently enforce length limits, type checks, allowed values, and authorization. Do not weaken or remove server-side validation because the client validates.
- **Sensitive fields** (password, current password, new password, confirm password, AWS access key, GCP service account JSON, Azure secret, API tokens, reCAPTCHA inputs) must use `type="password"` where appropriate, set `autocomplete` correctly (`current-password`, `new-password`, `off`), and must not be persisted in browser storage or React state beyond the submission.
- **reCAPTCHA verification on signin / signup / password-reset must remain server-side**. Flag any PR that removes the server check, even if the client still renders the widget.

#### Error boundaries and messages

- Toasts, dialogs, error boundaries, and inline error messages must not surface raw backend error strings, stack traces, internal API paths, SQL fragments, Go panics, trace IDs, or database error codes to end customers. Show a generic friendly message; log technical detail server-side or to a sanitized analytics channel.
- Provider-facing technical detail (e.g., for debugging) belongs in dev-mode logs or backend logs, not in end-customer-visible UI. Flag changes that read `error.response.data.message` and pass it directly into JSX or toast text without sanitization.

#### File uploads and downloads

- The portal supports file upload for instance restore. For any new file input or upload flow: enforce client-side MIME type and size checks (UX), but rely on the backend as the source of truth for actual validation, virus scanning, and storage decisions.
- **Never render uploaded HTML, SVG, or PDF inline** without sanitization or sandboxing — SVGs in particular can carry script. Downloaded files should be served with `Content-Disposition: attachment` and a sanitized filename.
- Logs viewable in the UI are passed through the syntax highlighter; do not bypass that path with a raw `dangerouslySetInnerHTML`.

#### Dependency hygiene

- For each new entry in `package.json` (or major version bump), the review comment should sanity-check: maintenance status, install size, transitive dependency surface, license compatibility, and known CVEs (`yarn npm audit` / GitHub advisories). Flag lockfile diffs that pull in unexpectedly large transitive trees or packages from unfamiliar maintainers. Postinstall scripts should remain disabled.
- This repo is **fork-friendly by design** — be conservative about adding heavy dependencies that every downstream provider will inherit.

#### White-label / multi-tenant safety

- Treat **all provider-supplied configuration** (organization name, description, logo URL, favicon, support email, privacy policy URL, terms of use URL, plan descriptions, install instructions) as untrusted input from the perspective of the end customer rendering the portal. The same sanitization rules that apply to user input apply here.
- Defaults shipped in the open-source repo must be safe for any provider to deploy as-is. Do not hard-code Omnistrate-internal URLs, telemetry endpoints, or analytics IDs in a way that a downstream fork inherits silently.

#### Quick "❌ flag this" examples

```ts
// ❌ Flag this — token in localStorage
localStorage.setItem("omnistrate_token", response.data.jwtToken);

// ✅ Backend should set httpOnly cookie; client reads only the indicator
// (see src/server/utils/authCookie.ts)
```

```tsx
// ❌ Flag this — provider-supplied URL rendered without scheme validation
<a href={org.privacyPolicyUrl}>Privacy</a>

// ✅ Validate the scheme before rendering (parse and allow only http/https)
let target = "/privacy";
try {
  const parsed = new URL(org.privacyPolicyUrl);
  if (parsed.protocol === "http:" || parsed.protocol === "https:") {
    target = parsed.toString();
  }
} catch {
  target = "/privacy";
}
<a href={target}>Privacy</a>
```

```tsx
// ❌ Flag this — provider HTML rendered without sanitization
<div dangerouslySetInnerHTML={{ __html: plan.descriptionHtml }} />

// ✅ Sanitize first
import DOMPurify from "dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(plan.descriptionHtml) }} />
```

```ts
// ❌ Flag this — open redirect from query param
router.push(searchParams.get("next") ?? "/dashboard");

// ✅ Validate against the existing internal-route allowlist
//    (src/utils/route/checkRouteValidity.ts, backed by PAGE_TITLE_MAP)
const next = searchParams.get("next") ?? "/dashboard";
router.push(checkRouteValidity(next) ? next : "/dashboard");
```

```ts
// ❌ Flag this — raw backend error rendered to end customer
toast.error(error.response.data.message);

// ✅ Generic friendly message; log detail to a sanitized channel
toast.error("Something went wrong. Please try again.");
logSanitized(error);
```

## Review Process

1. **Technical Review**: Check TypeScript implementation, testing, code quality, and naming conventions
2. **Content Review**: Review grammar, syntax, and terminology consistency
3. **Performance**: Check for potential performance impacts
4. **Security**: Review for security and privacy best practices (see Security and Privacy section above)
5. **Consistency**: Ensure alignment with project standards

<!-- security-checklist-managed -->

## Security Checklist

Apply this checklist to every code change. If a control is not applicable, briefly say why in the PR description.

### Authentication
- The browser is untrusted. Treat every value held in the client (user ID, org ID, role, feature flag) as a hint for UX only — the backend re-validates.
- Session tokens must be stored in `HttpOnly`, `Secure`, `SameSite=Lax` (or stricter) cookies. Do not put long-lived tokens in `localStorage` or `sessionStorage`.
- Never embed a long-lived API key, service account, or signing secret in client code or `NEXT_PUBLIC_*` env vars.
- Implement silent refresh through a server-side route, not by exposing refresh tokens to the browser.

### Authorization
- The UI must hide actions the caller cannot perform, but the server is the source of truth — never assume "if the button is hidden, the API is safe".
- Route guards (`middleware.ts`, layouts) must enforce auth on every protected segment; default-deny for unknown roles.
- Cross-org / cross-instance navigation must re-fetch authorization context — do not reuse a previous tenant's permissions cache.

### Tenant Isolation
- The client may send tenant/resource identifiers for routing, but the **server must derive and enforce tenant membership from the authenticated session/token**. Never treat client-selected `orgID`/`instanceID` as proof of authorization.
- Caches (`SWR`, `react-query`, in-memory stores) must key on the active `orgID` so that switching tenants cannot leak data from a prior tenant.
- Avoid placing tenant-identifying data into `localStorage` keyed by a fixed name — namespace by tenant or clear on logout/switch.

### Input Validation & Output Encoding
- Validate forms on the client for UX, but treat server-side validation as authoritative.
- Never use `dangerouslySetInnerHTML` on untrusted input. If markdown rendering is required, sanitize with a vetted library (e.g., DOMPurify) and an allowlist.
- Escape values placed into URLs, query strings, and `href`/`src` attributes; reject `javascript:` / `data:` URIs from user input.
- Validate redirect targets against an allowlist before issuing a client-side or server-side redirect.

### CSRF & CORS
- State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) must be protected by `SameSite` cookies and/or a CSRF token; never accept state changes via `GET`.
- Do not set `Access-Control-Allow-Origin: *` on any authenticated endpoint or proxy.

### Secrets Handling
- Differentiate `NEXT_PUBLIC_*` (shipped to browser) from server-only env vars. Anything secret must NOT be `NEXT_PUBLIC_*`.
- Never commit `.env*` files. Provide `.env.example` with placeholders only.
- Do not write secrets into HTML, JSON-LD, or inline `<script>` blobs.

### Logging Hygiene
- No `console.log` / `console.error` of tokens, full headers, full request bodies, or PII — neither in client code nor in server-side logs.
- Sanitize error messages shown to users; never surface raw stack traces, SQL errors, or upstream JSON to the UI.
- Telemetry events (analytics, RUM, error tracking) must scrub email, names, and free-text input before transmission.

### Dependencies
- Run `npm audit` (or `pnpm audit`) on PRs that change `package.json`. Resolve high/critical findings or document the exception.
- Prefer first-party / well-maintained packages with TypeScript types. Justify any new dependency in the PR description.
- Pin GitHub Actions to commit SHAs, not tags.
- Review the bundle for unintentionally shipped server-only modules (e.g., `fs`, `crypto` polyfills pulling secrets-handling code into the client).

### Content Security
- Maintain a strict CSP — no `unsafe-inline` script unless gated by a nonce/hash; no `unsafe-eval`.
- Do not load untrusted third-party scripts; pin SRI hashes for any external script that must be loaded.

### What to do when unsure
- If a change introduces a new auth flow, a new cross-tenant boundary, a new HTML sink, or a new third-party domain, call it out explicitly in the PR description.
- Prefer adding a Playwright/Cypress test that proves the security property (e.g., "user without role X cannot see element Y") over a comment claiming it.

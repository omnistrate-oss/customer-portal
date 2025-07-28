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

## Review Process

1. **Technical Review**: Check TypeScript implementation, testing, code quality, and naming conventions
2. **Content Review**: Review grammar, syntax, and terminology consistency
3. **Performance**: Check for potential performance impacts
4. **Security**: Review for security best practices
5. **Consistency**: Ensure alignment with project standards

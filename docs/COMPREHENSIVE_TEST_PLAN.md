# Customer Portal — Comprehensive Test Plan

## Application Overview

The **Customer Portal** (SaaS Builder) is a React/Next.js-based web application that enables end-users (customers) to manage their SaaS product subscriptions, resource instances, cloud accounts, custom networks, billing, and account settings. The application communicates with a backend API using **OpenAPI-typed** endpoints (versioned at `2022-09-01-00`) through both a proxied Axios client and an `openapi-fetch`/`openapi-react-query` typed client.

### Technology Stack

- **Framework**: Next.js (App Router) with React 18+
- **Language**: TypeScript / JavaScript
- **State Management**: Redux + React Context (`GlobalDataProvider`)
- **API Client**: `openapi-fetch` (typed) + Axios (legacy), TanStack React Query
- **UI Library**: Material UI (MUI) + Tailwind CSS
- **Forms**: Formik + Yup validation
- **Tables**: TanStack Table
- **Testing**: Playwright (E2E)
- **Auth**: JWT token in cookies, Identity Provider (SSO) support, ReCAPTCHA

### Key Application Modules

| Module                      | Route                                                                   | Description                                          |
| --------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| Sign In                     | `/signin`                                                               | User authentication with email/password and SSO      |
| Sign Up                     | `/signup`                                                               | New user registration                                |
| Reset Password              | `/reset-password`                                                       | Initiate password reset                              |
| Change Password             | `/change-password`                                                      | Set new password from email token                    |
| Dashboard                   | `/dashboard`                                                            | Overview with charts, maps, and audit logs           |
| Instances                   | `/instances`                                                            | CRUD lifecycle management of resource instances      |
| Instance Details            | `/instances/:serviceId/:planId/:resourceId/:instanceId/:subscriptionId` | Detailed instance view with tabs                     |
| Subscriptions               | `/subscriptions`                                                        | Manage service subscriptions                         |
| Cloud Accounts              | `/cloud-accounts`                                                       | BYOA (Bring Your Own Account) cloud provider configs |
| Custom Networks             | `/custom-networks`                                                      | Create and manage custom VPC/VNet networks           |
| Access Control              | `/access-control`                                                       | Manage users, invite, and RBAC                       |
| Billing                     | `/billing`                                                              | View billing status, consumption usage, invoices     |
| Cost Explorer               | `/cost-explorer`                                                        | Daily usage analysis with date range filtering       |
| Audit Logs                  | `/audit-logs`                                                           | Filterable event/audit trail                         |
| Alerts                      | `/alerts`                                                               | Notification center                                  |
| Instance Snapshots          | `/instance-snapshots`                                                   | Create/restore/copy/delete snapshots                 |
| Release History             | `/release-history`                                                      | Version set management                               |
| Settings                    | `/settings`                                                             | Profile, password change, account deletion           |
| Terms/Privacy/Cookie Policy | `/terms-of-use`, `/privacy-policy`, `/cookie-policy`                    | Legal pages                                          |

### API Endpoints (from OpenAPI Schema)

The backend exposes endpoints under `/2022-09-01-00/` including:

| API Domain            | Endpoints                                                                                                                                                                        | Methods                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| **Auth**              | `customer-user-signin`, `customer-user-signup`, `customer-reset-password`, `change-password`, `customer-login-with-identity-provider`                                            | POST                     |
| **User**              | `user`, `user/{id}`, `users/{id}/regenerate-token`, `customer-delete-user`, `customer-invite-user`, `change-user-role`                                                           | GET, PUT, DELETE, POST   |
| **Account Config**    | `accountconfig`, `accountconfig/{id}`, `accountconfig/byoa`, `accountconfig/cloudprovider/{name}`, `accountconfig/verify/{id}`                                                   | GET, POST, DELETE        |
| **Subscription**      | `subscription`, `subscription/{id}`, `subscription/request`, `subscription/request/{id}`                                                                                         | GET, POST, DELETE        |
| **Service Offering**  | `service-offering`, `service-offering/{serviceId}`, `service-offering/{serviceId}/resource/{resourceId}/instance/{instanceId}`                                                   | GET                      |
| **Resource Instance** | `resource-instance` (CRUD), `.../{id}/start`, `stop`, `restart`, `restore`, `failover`, `add-capacity`, `remove-capacity`, `custom-dns`, `copy-snapshot`, `snapshot`, `metadata` | GET, POST, PUT, DELETE   |
| **Custom Network**    | `resource-instance/custom-network`, `resource-instance/custom-network/{id}`                                                                                                      | GET, POST, PATCH, DELETE |
| **Billing**           | `resource-instance/billing-details`, `resource-instance/billing-status`, `resource-instance/usage`, `resource-instance/usage-per-day`, `resource-instance/invoice`               | GET                      |
| **Events/Audit**      | `resource-instance/audit-events`, `resource-instance/{instanceId}/audit-events`, `resource-instance/audit-events/{id}`                                                           | GET                      |
| **Snapshots**         | `resource-instance/snapshot`, `resource-instance/snapshot/{id}`, `resource-instance/snapshot/{snapshotId}/restore`                                                               | GET, POST, DELETE        |
| **Region**            | `region/{id}`, `region/cloudprovider/{cloudProviderName}`                                                                                                                        | GET                      |
| **Cloud Provider**    | `cloud-provider`, `cloud-provider/{id}`, `cloud-provider/name/{name}`                                                                                                            | GET                      |
| **Health**            | `resource-instance/health`, `health`                                                                                                                                             | GET                      |
| **Identity Provider** | `identity-provider`, `identity-provider-render`, `identity-provider-types`, `identity-provider/{id}`                                                                             | GET, POST, PUT, DELETE   |
| **Misc**              | `contactus`, `customdomain`, `invoice`, `demo`                                                                                                                                   | Various                  |

---

## Test Scenarios

---

### 1. Authentication — Sign In

**Seed:** `tests/auth/signin.spec.ts` (existing tests — extend coverage)

#### 1.1 Page Load and Structure

**Steps:**

1. Navigate to `/signin`
2. Verify the page title is "Sign In"
3. Verify the email input field is visible with placeholder "Email"
4. Verify the "Next" button is visible
5. Verify the provider logo is rendered (if configured)

**Expected Results:**

- Page loads without errors
- Email input and Next button are accessible
- No console errors

#### 1.2 Email Field Validation — Empty Submission

**Steps:**

1. Navigate to `/signin`
2. Leave the email field empty
3. Click the "Next" button

**Expected Results:**

- Error message "Email is required" is displayed below the email field

#### 1.3 Email Field Validation — Invalid Format

**Steps:**

1. Navigate to `/signin`
2. Enter "invalid-email" in the email field
3. Click the "Next" button

**Expected Results:**

- Error message "Invalid email address" is displayed

#### 1.4 Email Field Validation — Valid Email Progresses to Login Options

**Steps:**

1. Navigate to `/signin`
2. Enter a valid email address (e.g., `user@example.com`)
3. Click the "Next" button

**Expected Results:**

- The login options step is displayed
- "Other Sign In Options" button is visible
- Email field is disabled (pre-filled)

#### 1.5 Password Login — Successful Authentication

**Steps:**

1. Navigate to `/signin`
2. Enter valid email and proceed to password step
3. Enter valid password
4. Click the "Login" button

**Expected Results:**

- User is authenticated
- JWT token is stored in cookie
- User is redirected to `/instances`
- Subscriptions and service offerings are loaded

**API Calls Verified:**

- `POST /api/signin` → returns `{ jwtToken }`
- `GET /2022-09-01-00/subscription` → subscriptions list
- `GET /2022-09-01-00/service-offering` → service offerings list

#### 1.6 Password Login — Invalid Credentials

**Steps:**

1. Navigate to `/signin`
2. Enter valid email, proceed to password step
3. Enter incorrect password
4. Click the "Login" button

**Expected Results:**

- Error message is displayed (e.g., "Invalid email or password")
- User remains on the sign-in page
- No token is stored

**API Calls Verified:**

- `POST /api/signin` → returns 401

#### 1.7 Password Validation — Empty Password

**Steps:**

1. Proceed to password step
2. Leave the password field empty
3. Click away (blur) from the password field

**Expected Results:**

- Error message "Password is required" is displayed

#### 1.8 Identity Provider (SSO) Login

**Steps:**

1. Navigate to `/signin`
2. Enter an email with a configured identity provider domain
3. Click "Next"
4. Verify identity provider buttons are shown
5. Click an identity provider button

**Expected Results:**

- User is redirected to the identity provider's authorization URL
- After successful IDP auth, callback to `/idp-auth` with code and state
- `POST /api/sign-in-with-idp` returns JWT token
- User is redirected to `/instances`

**API Calls Verified:**

- `GET /2022-09-01-00/identity-provider-render` → identity providers list
- `POST /api/sign-in-with-idp` → `{ jwtToken }`

#### 1.9 IDP Auth Callback — Invalid State

**Steps:**

1. Navigate to `/idp-auth?state=invalid&code=test`
2. Session storage has no matching auth state

**Expected Results:**

- Authentication fails gracefully
- User is redirected to sign-in page with an error

#### 1.10 Forgot Password Link

**Steps:**

1. Navigate to password login step
2. Click "Forgot Password" link

**Expected Results:**

- User is navigated to `/reset-password`
- Reset password form is visible

#### 1.11 Sign Up Link (PROD Environment Only)

**Steps:**

1. Navigate to password login step
2. Verify "Sign Up" link is present (PROD only)
3. Click the "Sign Up" link

**Expected Results:**

- User is navigated to `/signup`

#### 1.12 Cookie Consent Banner

**Steps:**

1. Navigate to `/signin`
2. Verify cookie consent banner is visible
3. Click "Allow analytics"
4. Verify banner disappears
5. Click "Cookie Settings" footer text
6. Verify banner reappears
7. Click "Allow necessary"
8. Verify banner disappears

**Expected Results:**

- Cookie consent persists across page loads
- Cookie policy link points to `/cookie-policy`

#### 1.13 Session Expiration — 401 Response

**Steps:**

1. Sign in successfully
2. Invalidate token (simulate expired token)
3. Trigger an authenticated API call

**Expected Results:**

- User receives a 401 response
- Token is cleared from cookies
- User is redirected to `/signin`

**API Behavior Verified:**

- `apiClient` middleware detects 401, clears cookies, redirects to `/signin`

---

### 2. Authentication — Sign Up

#### 2.1 Page Load and Structure

**Steps:**

1. Navigate to `/signup`
2. Verify the page title is "Sign up"
3. Verify form fields: Name, Email, Password, Confirm Password

**Expected Results:**

- All fields are visible and accessible

#### 2.2 Form Validation — All Fields Required

**Steps:**

1. Navigate to `/signup`
2. Click submit without filling any fields

**Expected Results:**

- Validation errors are shown for all required fields

#### 2.3 Form Validation — Password Requirements

**Steps:**

1. Enter a password that doesn't meet requirements (e.g., "abc")
2. Verify validation error describes requirements (min 8 chars, letters + numbers)
3. Enter password matching the email address
4. Verify "password must not match email" validation

**Expected Results:**

- Password regex validation error messages are displayed
- Password matching email is rejected

#### 2.4 Successful Registration

**Steps:**

1. Fill in valid Name, Email, Password, Confirm Password
2. Submit the form

**Expected Results:**

- API call `POST /api/signup` is made
- Success message or redirect occurs

**API Calls Verified:**

- `POST /2022-09-01-00/customer-user-signup`

#### 2.5 SSO Registration

**Steps:**

1. Navigate to `/signup`
2. Verify SSO identity provider buttons are visible (if configured)
3. Click an SSO button

**Expected Results:**

- User is redirected to the identity provider

---

### 3. Authentication — Reset Password

**Seed:** `tests/auth/reset-password.spec.ts` (existing tests)

#### 3.1 Page Load and Structure

**Steps:**

1. Navigate to `/reset-password`
2. Verify the heading "Reset your password" is visible
3. Verify email input and submit button are visible

**Expected Results:**

- Page loads with correct layout

#### 3.2 Form Validation

**Steps:**

1. Click submit without entering email
2. Verify "Email is required" error
3. Enter "invalid-email"
4. Verify "Invalid email address" error

**Expected Results:**

- Proper client-side validation

#### 3.3 Successful Reset Request

**Steps:**

1. Enter a valid email
2. Click submit

**Expected Results:**

- Success heading "Check Your Email for a Password Reset Link" appears
- "Go to Login" button links to `/signin`
- "Try again" link returns to the form

**API Calls Verified:**

- `POST /api/reset-password` → `POST /2022-09-01-00/customer-reset-password`

---

### 4. Authentication — Change Password

#### 4.1 Valid Token Flow

**Steps:**

1. Navigate to `/change-password?email=user@example.com&token=valid-token`
2. Verify "Update your password" heading
3. Fill "New Password" and "Confirm Password" fields
4. Submit the form

**Expected Results:**

- Password change success message
- User is redirected to `/signin`

**API Calls Verified:**

- `POST /2022-09-01-00/change-password`

#### 4.2 Missing Token

**Steps:**

1. Navigate to `/change-password` (without email/token params)

**Expected Results:**

- Message: "Missing password change credentials. Please check your email and click the link to retry"
- Form is not shown

#### 4.3 Password Validation

**Steps:**

1. Navigate with valid email and token
2. Enter mismatching passwords
3. Verify "Passwords must match" error
4. Enter password not meeting complexity requirements
5. Verify regex validation error

---

### 5. Dashboard

#### 5.1 Page Load and Data Rendering

**Steps:**

1. Sign in and navigate to `/dashboard`
2. Verify the "Dashboard" heading is displayed

**Expected Results:**

- Page loads without errors
- Dashboard components render

#### 5.2 Cluster Locations Map

**Steps:**

1. Verify the cluster locations component is rendered
2. Data from instances is displayed on the map

**Expected Results:**

- Map shows instance locations based on cloud region

#### 5.3 Audit Logs Widget

**Steps:**

1. Verify the audit logs table is displayed at the top
2. Verify columns: Deployment ID, Service Name, Resource Type, Time, Message, User, Subscription/Plan, Owner, User Agent
3. Verify maximum 5 entries are shown

**Expected Results:**

- Table loads with latest 5 audit events
- Table has no pagination (limited to 5)

**API Calls Verified:**

- `GET /2022-09-01-00/resource-instance/audit-events?pageSize=5&eventSourceTypes=Customer`

#### 5.4 Chart Widgets

**Steps:**

1. Verify "Deployments by Lifecycle Stage" chart renders
2. Verify "Deployments by Health Status" chart renders
3. Verify "Deployments by System Load" chart renders
4. Verify "Deployments by Month – Last 12 Months" chart renders

**Expected Results:**

- All charts render with data from instances
- Loading spinners shown while data is fetching
- Charts display accurate aggregate information

#### 5.5 Empty State — No Instances

**Steps:**

1. Sign in with a user that has no instances
2. Navigate to `/dashboard`

**Expected Results:**

- Charts display empty/zero state gracefully
- No JavaScript errors

---

### 6. Instances — Listing and Lifecycle Management

**Seed:** `tests/deployments/instances/basic-tests.spec.ts` (existing)

#### 6.1 Page Load and Structure

**Steps:**

1. Navigate to `/instances`
2. Verify toolbar buttons are visible: Refresh, Stop, Start, Modify, Delete, Create, Actions Menu

**Expected Results:**

- All action buttons are rendered
- DataTable is rendered (may show "No instances" if empty)

**API Calls Verified:**

- `GET /2022-09-01-00/resource-instance` → list all instances

#### 6.2 Instances Table Columns

**Steps:**

1. Navigate to `/instances` with existing instances
2. Verify table columns include: Instance ID, Service Name, Status, Region, Cloud Provider, Health Status, Load, License Status, Delete Protection, Created Date, Tags

**Expected Results:**

- All columns render with correct data
- Status chips display correct colors and labels

#### 6.3 Create a New Instance

**Steps:**

1. Click the "Create" button
2. Full-screen drawer opens with creation form
3. Select a service name from the dropdown
4. If subscription required, click "Subscribe" button
5. Select cloud provider (AWS/GCP/Azure/OCI card)
6. Select a region from the dropdown
7. Fill any required parameters (e.g., password, username)
8. Wait 5 seconds for form to settle
9. Click "Submit"

**Expected Results:**

- "Launching Your Instance" dialog appears
- Instance ID is displayed
- After closing dialog, instance appears in the table with "Pending" or "Deploying" status

**API Calls Verified:**

- `POST /2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}?subscriptionId={subId}`

#### 6.4 Instance Reaches Running State

**Steps:**

1. After creation, poll/refresh the table
2. Wait for instance status to change to "Running"

**Expected Results:**

- Instance transitions through: Pending → Deploying → Running
- Status chip updates to "Running" with correct styling
- Health status shows a valid value

#### 6.5 Stop an Instance

**Steps:**

1. Select an instance checkbox (Running state)
2. Click the "Stop" button
3. Type "stop" in the confirmation dialog
4. Click the "Stop" confirmation button

**Expected Results:**

- Instance transitions to "Stopping" → "Stopped"
- Status chip updates accordingly

**API Calls Verified:**

- `POST /2022-09-01-00/resource-instance/.../stop`

#### 6.6 Start a Stopped Instance

**Steps:**

1. Select a stopped instance
2. Click the "Start" button

**Expected Results:**

- Instance transitions to "Starting" → "Running"

**API Calls Verified:**

- `POST /2022-09-01-00/resource-instance/.../start`

#### 6.7 Reboot an Instance

**Steps:**

1. Select a running instance
2. Open the Actions Menu
3. Click "Reboot"
4. Type "reboot" in confirmation dialog
5. Click "Reboot" confirmation button

**Expected Results:**

- Instance transitions to "Restarting" → "Running"

**API Calls Verified:**

- `POST /2022-09-01-00/resource-instance/.../restart`

#### 6.8 Modify an Instance

**Steps:**

1. Select an instance
2. Click the "Modify" button
3. Update parameter values (e.g., password, username)
4. Click "Submit"

**Expected Results:**

- Instance transitions to "Deploying" → "Running"
- Updated parameters are reflected in instance details

**API Calls Verified:**

- `PUT /2022-09-01-00/resource-instance/...//{id}?subscriptionId={subId}`

#### 6.9 Delete an Instance

**Steps:**

1. Select an instance
2. Click the "Delete" button
3. Type "deleteme" in the confirmation dialog
4. Click "Delete" confirmation button

**Expected Results:**

- Instance transitions to "Deleting"
- Eventually, instance is removed from the table

**API Calls Verified:**

- `DELETE /2022-09-01-00/resource-instance/...//{id}?subscriptionId={subId}`

#### 6.10 Add Capacity

**Steps:**

1. Select a running instance
2. Open the Actions Menu
3. Click "Add Capacity"
4. Enter capacity number
5. Click submit

**Expected Results:**

- API call is made to add capacity
- Instance remains running after capacity addition

**API Calls Verified:**

- `POST /2022-09-01-00/resource-instance/.../{id}/add-capacity`

#### 6.11 Remove Capacity

**Steps:**

1. Select a running instance
2. Open the Actions Menu
3. Click "Remove Capacity"
4. Enter capacity number to remove
5. Click submit

**Expected Results:**

- API call is made to remove capacity

**API Calls Verified:**

- `POST /2022-09-01-00/resource-instance/.../{id}/remove-capacity`

#### 6.12 Generate Token

**Steps:**

1. Select an instance
2. Open the Actions Menu
3. Click "Generate Token"

**Expected Results:**

- Token dialog appears with a generated token

#### 6.13 Download CLI / Installer

**Steps:**

1. Click the download installer icon on an instance row
2. Modal with installer/upgrader instructions opens

**Expected Results:**

- Download initiates
- Installer instructions are displayed

**API Calls Verified:**

- `GET /service/{serviceId}/service-api/{serviceApiId}/cli` (blob response)

#### 6.14 Instance Failure Handling

**Steps:**

1. Simulate or encounter an instance that enters "Failed" status

**Expected Results:**

- Status chip shows "Failed"
- Error is not propagated to other instances
- Retry options are available (via reboot/delete)

#### 6.15 Filter and Search Instances

**Steps:**

1. Use the search/filter controls in the table header
2. Filter by service name, status, or search by instance ID

**Expected Results:**

- Table filters correctly
- Result count updates

#### 6.16 Navigate to Instance Details

**Steps:**

1. Click on an instance ID in the table

**Expected Results:**

- Navigate to `/instances/{serviceId}/{planId}/{resourceId}/{instanceId}/{subscriptionId}`
- Instance details page loads

---

### 7. Instance Details

#### 7.1 Overview Section

**Steps:**

1. Navigate to instance details page
2. Verify the resource instance overview section is visible

**Expected Results:**

- Instance overview card displays: Instance ID, Status, Cloud Provider, Region, Service Name

#### 7.2 Instance Details Tab

**Steps:**

1. Click the "Instance Details" tab
2. Verify deployment details are shown

**Expected Results:**

- Fields displayed: Deployment ID, Created At, Modified At, High Availability Status, Backups Status, Auto-Scaling Status
- Output parameters table is visible
- License status table is visible (if applicable)

#### 7.3 Connectivity Tab

**Steps:**

1. Click the "Connectivity" tab

**Expected Results:**

- Network Type, Availability Zones, Publicly Accessible, Private Network CIDR, Private Network ID are displayed

#### 7.4 Nodes Tab

**Steps:**

1. Click the "Nodes" tab

**Expected Results:**

- Description "View and manage your Nodes" is visible
- Nodes table displays node details

#### 7.5 Metrics Tab — Running Instance

**Steps:**

1. Click the "Metrics" tab (instance is Running)

**Expected Results:**

- Description "Metrics for monitoring and performance insights" is visible
- Metric cards displayed: CPU Usage, Load Average, Storage, Total RAM, Used RAM, RAM Usage, System Uptime
- Node ID dropdown for filtering metrics

#### 7.6 Metrics Tab — Stopped Instance

**Steps:**

1. Navigate to a stopped instance
2. Click the "Metrics" tab

**Expected Results:**

- Message: "Metrics are not available as the instance is not running"

#### 7.7 Live Logs Tab — Running Instance

**Steps:**

1. Click the "Live Logs" tab (instance is Running)

**Expected Results:**

- Description "Detailed logs for monitoring and troubleshooting"
- Logs container is visible
- Scroll-to-top and scroll-to-bottom buttons are available
- Node ID dropdown for filtering logs

#### 7.8 Live Logs Tab — Stopped Instance

**Steps:**

1. Navigate to a stopped instance
2. Click the "Live Logs" tab

**Expected Results:**

- Message: "Logs are not available as the instance is not running"

#### 7.9 Audit Logs Tab

**Steps:**

1. Click the "Audit Logs" tab

**Expected Results:**

- "List of Logs" table title is visible
- Audit events for this instance are displayed

**API Calls Verified:**

- `GET /2022-09-01-00/resource-instance/{instanceId}/audit-events`

#### 7.10 Backups Tab

**Steps:**

1. Click the "Backups" tab (if available for the service)

**Expected Results:**

- Snapshot list for the instance is displayed
- Restore and Create Snapshot options are available

#### 7.11 Custom DNS Tab

**Steps:**

1. Click the "Custom DNS" tab (if applicable)

**Expected Results:**

- Custom DNS configuration interface is displayed

**API Calls Verified:**

- `POST /2022-09-01-00/resource-instance/.../{id}/custom-dns`
- `DELETE /2022-09-01-00/resource-instance/.../{id}/custom-dns`

---

### 8. Subscriptions

#### 8.1 Page Load and Structure

**Steps:**

1. Navigate to `/subscriptions`

**Expected Results:**

- Subscriptions table is rendered
- Columns include: Subscription ID, Service Name, Plan, Status, Type (Direct/Invited), Created Date

#### 8.2 View Subscription Details

**Steps:**

1. Click on a Subscription ID in the table

**Expected Results:**

- Subscription details drawer opens
- Details include service name, plan, status, created date

#### 8.3 Create/Manage Subscription

**Steps:**

1. Navigate to `/subscriptions?serviceId=...&servicePlanId=...`
2. Or click "Manage Subscriptions" button

**Expected Results:**

- Manage Subscriptions form drawer opens
- User can subscribe to available plans

#### 8.4 Unsubscribe

**Steps:**

1. Select a subscription
2. Click "Delete/Unsubscribe"
3. Type confirmation text
4. Confirm deletion

**Expected Results:**

- Subscription is removed
- Table refreshes

**API Calls Verified:**

- `DELETE /2022-09-01-00/subscription/{id}`

#### 8.5 Deep Link — Pre-filled Search

**Steps:**

1. Navigate to `/subscriptions?subscriptionId=sub-123`

**Expected Results:**

- Search is pre-filled with the subscription ID
- Matching subscription is highlighted/filtered

#### 8.6 Empty State

**Steps:**

1. Sign in with a user that has no subscriptions

**Expected Results:**

- Empty state message is displayed
- "Manage Subscriptions" button is still accessible

---

### 9. Cloud Accounts (BYOA)

**Seed:** `tests/deployments/instances/byoa-instance.spec.ts` (existing)

#### 9.1 Page Load and Structure

**Steps:**

1. Navigate to `/cloud-accounts`

**Expected Results:**

- Cloud Accounts table is rendered
- Toolbar buttons: Refresh, Delete, Disconnect, Connect, Create

#### 9.2 Create Cloud Account — AWS

**Steps:**

1. Click "Create" button
2. Select service name from dropdown
3. If subscribe needed, click "Subscribe"
4. Enter AWS Account ID
5. Click "Submit"

**Expected Results:**

- Account Configuration Instructions dialog appears
- Cloud account instance is created
- Cloud account appears in table
- Transitions to "Ready" status

**API Calls Verified:**

- `POST /2022-09-01-00/resource-instance/...` (cloud account creation)

#### 9.3 Create Cloud Account — GCP

**Steps:**

1. Click "Create" button
2. Select service name
3. Enter GCP Project ID and GCP Project Number
4. Click "Submit"

**Expected Results:**

- Similar to AWS flow
- GCP bootstrap shell command is shown in instructions

#### 9.4 Connect/Disconnect Cloud Account

**Steps:**

1. Select a cloud account
2. Click "Disconnect"
3. Confirm disconnection
4. Verify status changes
5. Click "Connect"
6. Confirm connection

**Expected Results:**

- Account toggles between connected/disconnected states

**API Calls Verified:**

- `POST /2022-09-01-00/resource-instance/account-config/{instanceId}`

#### 9.5 Delete Cloud Account

**Steps:**

1. Select a cloud account
2. Click "Delete"
3. Type "deleteme" in confirmation
4. Click "Delete" submit button

**Expected Results:**

- Cloud account is removed from the table

**API Calls Verified:**

- `DELETE /2022-09-01-00/resource-instance/.../{id}`

#### 9.6 View Instructions

**Steps:**

1. Click the "View Instructions" icon on a cloud account row

**Expected Results:**

- Instructions dialog opens with cloud-provider-specific setup steps

#### 9.7 Deletion Protection

**Steps:**

1. Enable deletion protection on a cloud account
2. Try to delete the cloud account

**Expected Results:**

- Deletion is prevented
- User must disable protection first

#### 9.8 Deep Link — Pre-filled Service

**Steps:**

1. Navigate to `/cloud-accounts?serviceId=...&servicePlanId=...&subscriptionId=...`

**Expected Results:**

- Create form opens pre-filtered for the specified service

---

### 10. Custom Networks

#### 10.1 Page Load and Structure

**Steps:**

1. Navigate to `/custom-networks`

**Expected Results:**

- Custom Networks table is rendered
- Toolbar: Refresh, Modify, Delete, Peering Info, Create

#### 10.2 Create Custom Network

**Steps:**

1. Click "Create" button
2. Enter network name
3. Select cloud provider (AWS/GCP/Azure/OCI)
4. Select region
5. Enter CIDR range
6. Click "Submit"

**Expected Results:**

- Network is created and appears in the table
- Status transitions to active

**API Calls Verified:**

- `POST /2022-09-01-00/resource-instance/custom-network`

#### 10.3 Modify Custom Network

**Steps:**

1. Select a custom network
2. Click "Modify"
3. Update fields
4. Submit

**Expected Results:**

- Network is updated

**API Calls Verified:**

- `PATCH /2022-09-01-00/resource-instance/custom-network/{id}`

#### 10.4 Delete Custom Network

**Steps:**

1. Select a custom network
2. Click "Delete"
3. Type "deleteme" in confirmation
4. Submit

**Expected Results:**

- Network is deleted from the table

**API Calls Verified:**

- `DELETE /2022-09-01-00/resource-instance/custom-network/{id}`

#### 10.5 View Peering Information

**Steps:**

1. Select a custom network
2. Click "Peering Info"

**Expected Results:**

- Peering information dialog displays relevant peering details

#### 10.6 Search Custom Networks

**Steps:**

1. Enter a search term in the search field
2. Verify networks are filtered by name

**Expected Results:**

- Only matching networks are displayed

#### 10.7 Deep Link — Auto-Open Create Form

**Steps:**

1. Navigate to `/custom-networks?overlay=create`

**Expected Results:**

- Create Custom Network form drawer opens automatically

---

### 11. Access Control

#### 11.1 Page Load and Structure

**Steps:**

1. Navigate to `/access-control`

**Expected Results:**

- Users table is rendered
- Columns: Name, Email Address, Role, Subscription (service name + plan), Type (Direct/Invited)

#### 11.2 Invite User

**Steps:**

1. Fill in the Invite Users card with user email
2. Select subscription
3. Submit invitation

**Expected Results:**

- Invitation is sent
- User appears in the table with "Invited" type

**API Calls Verified:**

- `POST /2022-09-01-00/resource-instance/subscription/{subscriptionId}/invite-user`

#### 11.3 Delete/Revoke User

**Steps:**

1. Select a user row
2. Click the delete icon
3. Type confirmation text
4. Submit

**Expected Results:**

- User is removed from the subscription

**API Calls Verified:**

- `POST /2022-09-01-00/resource-instance/subscription/{subscriptionId}/revoke-user-role`

#### 11.4 RBAC — Permission Checks

**Steps:**

1. Sign in as a user with limited role (e.g., reader)
2. Navigate to `/access-control`
3. Attempt to invite a user

**Expected Results:**

- Invite functionality is hidden or disabled for unauthorized roles
- `isOperationAllowedByRBAC` correctly controls visibility

#### 11.5 Deep Link — Search by User ID

**Steps:**

1. Navigate to `/access-control?searchUserId=user-123`

**Expected Results:**

- Search field is pre-filled with the user ID

---

### 12. Billing

#### 12.1 Page Load — Billing Enabled

**Steps:**

1. Navigate to `/billing`

**Expected Results:**

- Billing page loads
- Tabs: Consumption Usage, Invoices
- Payment status is shown

**API Calls Verified:**

- `GET /2022-09-01-00/resource-instance/billing-status`
- `GET /2022-09-01-00/resource-instance/billing-details?returnUrl=...`

#### 12.2 Billing Not Configured

**Steps:**

1. Navigate to `/billing` with a provider that hasn't enabled billing

**Expected Results:**

- Message: "Billing has not been configured. Please contact support for assistance"

#### 12.3 Consumption Usage Tab

**Steps:**

1. Click the "Consumption Usage" tab
2. Verify usage data is displayed

**Expected Results:**

- Usage breakdown by service and resource

**API Calls Verified:**

- `GET /2022-09-01-00/resource-instance/usage`

#### 12.4 Invoices Tab

**Steps:**

1. Click the "Invoices" tab
2. Verify invoices are listed

**Expected Results:**

- Invoice table with: Invoice ID, Status, Amount, Date
- Open invoices show payment URL link
- Total outstanding amount is calculated

**API Calls Verified:**

- `GET /2022-09-01-00/resource-instance/invoice`

#### 12.5 Payment Configuration

**Steps:**

1. Verify Stripe icon and billing provider details
2. If payment URL exists, click the payment link

**Expected Results:**

- External payment page opens (Stripe)
- Payment configured status updates after successful configuration

#### 12.6 Payment Status Change — Auto Refetch

**Steps:**

1. Configure payment (set `paymentConfigured` to true)

**Expected Results:**

- Subscriptions are automatically refetched after payment configuration changes

---

### 13. Cost Explorer

#### 13.1 Page Load

**Steps:**

1. Navigate to `/cost-explorer`

**Expected Results:**

- Cost Explorer page loads with date range picker
- Default date range: first day of current month to today
- Usage overview chart is rendered

#### 13.2 Date Range Selection

**Steps:**

1. Change the start date to a past date
2. Change the end date
3. Verify data refreshes

**Expected Results:**

- Usage per day data updates for the selected range
- Loading indicator shown during fetch

**API Calls Verified:**

- `GET /2022-09-01-00/resource-instance/usage-per-day?startDate=...&endDate=...`

#### 13.3 Filter by Subscription

**Steps:**

1. Select a specific subscription from the dropdown
2. Verify data is filtered

**Expected Results:**

- Cost data shows only for the selected subscription

**API Calls Verified:**

- `GET /2022-09-01-00/resource-instance/usage-per-day?subscriptionID=...`

#### 13.4 Empty State

**Steps:**

1. Select a date range with no usage data

**Expected Results:**

- Chart displays empty/zero state gracefully

---

### 14. Audit Logs

#### 14.1 Page Load and Structure

**Steps:**

1. Navigate to `/audit-logs`

**Expected Results:**

- "Audit Logs" page title with icon
- Events table with columns: Expand, Deployment ID, Service Name, Resource Type, Time, Type, Message, User, Subscription/Plan, Owner, User Agent

**API Calls Verified:**

- `GET /2022-09-01-00/resource-instance/audit-events?eventSourceTypes=Customer,Infra,Maintenance`

#### 14.2 Date Range Filter

**Steps:**

1. Select a custom date range using the date range picker
2. Verify audit logs refresh for the selected range

**Expected Results:**

- Only logs within the date range are displayed

#### 14.3 Service Filter

**Steps:**

1. Select a specific service from the service dropdown
2. Verify logs are filtered by service

**Expected Results:**

- Only logs for the selected service are shown

#### 14.4 Event Type Filter

**Steps:**

1. Select specific event types (Customer, Infra, Maintenance)
2. Verify logs are filtered

**Expected Results:**

- Only matching event types are displayed

#### 14.5 Pagination

**Steps:**

1. Verify "Load More" / infinite scroll works
2. Navigate to next page of results

**Expected Results:**

- Additional audit events are loaded
- Page index resets when filters change

#### 14.6 Expandable Row

**Steps:**

1. Click the expand button on an audit log entry

**Expected Results:**

- Full event details are revealed

---

### 15. Alerts (Notifications)

#### 15.1 Page Load

**Steps:**

1. Navigate to `/alerts`

**Expected Results:**

- "Alerts" page title with notification icon
- Notifications table is rendered

#### 15.2 View Notifications

**Steps:**

1. Verify notifications are listed
2. Check that notification data includes relevant event information

**Expected Results:**

- Notifications display with correct formatting

---

### 16. Instance Snapshots

#### 16.1 Page Load and Structure

**Steps:**

1. Navigate to `/instance-snapshots`

**Expected Results:**

- "Instance Snapshots" page title
- Snapshots table with columns: Snapshot ID, Instance ID, Service Name, Region, Cloud Provider, Status, Size, Created Date

#### 16.2 Create a Snapshot

**Steps:**

1. Click "Create Snapshot" button
2. Select an instance from the dropdown
3. Select a region
4. Click submit

**Expected Results:**

- Snapshot creation is initiated
- Snapshot appears in table with "Creating" status

**API Calls Verified:**

- `POST /2022-09-01-00/resource-instance/.../{id}/snapshot`

#### 16.3 Restore a Snapshot

**Steps:**

1. Select a snapshot
2. Click "Restore Snapshot"
3. Select custom network (if applicable)
4. Submit

**Expected Results:**

- Restore success dialog with new instance ID
- New instance is created from the snapshot

**API Calls Verified:**

- `POST /2022-09-01-00/resource-instance/.../snapshot/{snapshotId}/restore`

#### 16.4 Copy a Snapshot

**Steps:**

1. Select a snapshot
2. Click "Copy Snapshot"
3. Select target region
4. Submit

**Expected Results:**

- Snapshot copy is initiated to the target region

**API Calls Verified:**

- `POST /2022-09-01-00/resource-instance/.../{id}/copy-snapshot`

#### 16.5 Delete a Snapshot

**Steps:**

1. Select a snapshot
2. Click "Delete Snapshot"
3. Type "deleteme" in confirmation
4. Submit

**Expected Results:**

- Snapshot is removed from the table

**API Calls Verified:**

- `DELETE /2022-09-01-00/resource-instance/snapshot/{id}`

#### 16.6 Navigate to Snapshot Details

**Steps:**

1. Click on a Snapshot ID

**Expected Results:**

- Navigate to `/instance-snapshots/{snapshotId}`

#### 16.7 Navigate to Instance from Snapshot

**Steps:**

1. Click the instance link in a snapshot row

**Expected Results:**

- Navigate to the instance details page

---

### 17. Release History

#### 17.1 Page Load and Structure

**Steps:**

1. Navigate to `/release-history`

**Expected Results:**

- "Release History" page loads
- Product (service) dropdown and Plan dropdown are visible
- List of releases is displayed

#### 17.2 Filter by Product

**Steps:**

1. Select a different product from the dropdown

**Expected Results:**

- Plan dropdown updates with plans for the selected product
- Release list updates

#### 17.3 Filter by Plan

**Steps:**

1. Select a specific plan

**Expected Results:**

- Releases are filtered for the selected plan

#### 17.4 Version Set Display

**Steps:**

1. Verify releases display version information

**Expected Results:**

- Each release shows version, date, and relevant metadata

#### 17.5 Only Version Set Override Services

**Steps:**

1. Verify only services with `VERSION_SET_OVERRIDE` feature for `CUSTOMER` scope appear in the product dropdown

---

### 18. Settings

#### 18.1 Page Load and Structure

**Steps:**

1. Navigate to `/settings`

**Expected Results:**

- Account Management header with user name and email
- Tabs: Profile, Password, Delete Account (PROD only)
- Default tab is "Profile"

#### 18.2 Profile Tab — View Profile

**Steps:**

1. Verify profile form is populated with current user data

**Expected Results:**

- User name and email are displayed/editable

#### 18.3 Profile Tab — Update Profile

**Steps:**

1. Modify user profile fields
2. Submit the form

**Expected Results:**

- Profile is updated
- Success message is displayed

**API Calls Verified:**

- `PUT /2022-09-01-00/user/{id}` or equivalent update endpoint

#### 18.4 Password Tab — Change Password

**Steps:**

1. Click "Password" tab
2. Enter current email (pre-filled)
3. Trigger password reset flow

**Expected Results:**

- Password change form is displayed
- Validation rules apply

#### 18.5 Delete Account Tab (PROD Only)

**Steps:**

1. Click "Delete Account" tab (only visible in PROD)
2. Initiate account deletion

**Expected Results:**

- Confirmation dialog requires explicit action
- Account deletion API is called

**API Calls Verified:**

- `DELETE /2022-09-01-00/customer-delete-user`

#### 18.6 Delete Account Tab — Not Visible in Non-PROD

**Steps:**

1. In a DEV environment, navigate to `/settings`

**Expected Results:**

- "Delete Account" tab is not visible

---

### 19. Layout and Navigation

#### 19.1 Sidebar Navigation

**Steps:**

1. Sign in and navigate to any dashboard page
2. Verify sidebar contains links to all modules: Dashboard, Instances, Subscriptions, Cloud Accounts, Custom Networks, Access Control, Billing, Cost Explorer, Audit Logs, Alerts, Instance Snapshots, Release History, Settings

**Expected Results:**

- All navigation links are visible and clickable
- Active page is highlighted in the sidebar
- Sidebar width is ~304px (`ml-[19rem]`)

#### 19.2 Navbar

**Steps:**

1. Verify the top navigation bar is rendered

**Expected Results:**

- Provider logo, user info, and navigation actions are visible

#### 19.3 Footer

**Steps:**

1. Verify the footer is rendered at the bottom

**Expected Results:**

- Footer content is displayed

#### 19.4 Payment Configuration Warning Banner

**Steps:**

1. Sign in with a user whose billing is enabled but payment is not configured

**Expected Results:**

- Warning banner is displayed above the main content

#### 19.5 No Service Found State

**Steps:**

1. Sign in with a user that has no associated services/subscriptions

**Expected Results:**

- "No Service Found" UI is displayed (handled by `GlobalDataProvider`)

#### 19.6 Global Error Handler

**Steps:**

1. Trigger a 4xx/5xx API error (non-401)
2. Verify global error snackbar appears

**Expected Results:**

- Error snackbar shows the API error message
- Ignored messages (e.g., "You have not been subscribed to a service yet.") do not trigger the snackbar

---

### 20. Legal / Static Pages

#### 20.1 Terms of Use

**Steps:**

1. Navigate to `/terms-of-use`

**Expected Results:**

- Terms of Use content is rendered

#### 20.2 Privacy Policy

**Steps:**

1. Navigate to `/privacy-policy`

**Expected Results:**

- Privacy Policy content is rendered

#### 20.3 Cookie Policy

**Steps:**

1. Navigate to `/cookie-policy`

**Expected Results:**

- Cookie Policy content is rendered

---

### 21. API Client Middleware and Error Handling

#### 21.1 Request Proxying

**Steps:**

1. Make an API call from the frontend (e.g., fetch instances)
2. Verify the request is proxied through `/api/action`

**Expected Results:**

- Non-`/api` requests are transformed into `POST /api/action?endpoint=...`
- Original method, payload, and query params are sent in the body as metadata
- Content-Type is set to `application/json`

#### 21.2 Auth Token Injection

**Steps:**

1. Make an authenticated API call

**Expected Results:**

- `Authorization: Bearer {token}` header is set on all protected requests
- Non-protected endpoints (signin, signup, etc.) do not require the token

#### 21.3 Missing Auth Token — Request Abortion

**Steps:**

1. Remove the auth token cookie
2. Trigger a protected API call

**Expected Results:**

- Request is aborted with "Request aborted due to missing auth token"
- No network request is actually sent

#### 21.4 Empty Response Handling

**Steps:**

1. Trigger an API call that returns an empty body (e.g., some DELETE operations)

**Expected Results:**

- Response is wrapped as `{}` with `application/json` content type
- No parsing errors occur

#### 21.5 Non-JSON Response Handling

**Steps:**

1. Trigger an API call that returns non-JSON (e.g., text/plain)

**Expected Results:**

- Response is wrapped as `{ data: "<text content>" }`
- No parsing errors

#### 21.6 Global Error Snackbar — Filtered Messages

**Steps:**

1. Trigger API errors that return the following messages:
   - "You have not been subscribed to a service yet."
   - "Your provider has not enabled billing for the user."
   - "You have not been enrolled in a service plan with a billing plan yet."
   - "Your provider has not enabled billing for the services."

**Expected Results:**

- These specific messages do NOT trigger the global error snackbar

---

### 22. Edge Cases and Error Scenarios

#### 22.1 Network Disconnection

**Steps:**

1. Sign in and navigate to any page
2. Disconnect network
3. Trigger a data refresh

**Expected Results:**

- User-friendly error message is displayed
- Application does not crash

#### 22.2 Concurrent Operations

**Steps:**

1. Attempt to start and stop the same instance simultaneously

**Expected Results:**

- Operations are handled gracefully (one succeeds, other is rejected or queued)

#### 22.3 Long-Running Operations

**Steps:**

1. Create an instance that takes a long time to provision (e.g., Helm instance with 15+ minute timeout)

**Expected Results:**

- Status polling continues without timeout
- UI remains responsive
- Test timeout of 12 minutes is sufficient (configurable per test)

#### 22.4 Stale Data — Refetch

**Steps:**

1. Click the "Refresh" button on any data table

**Expected Results:**

- Data is refetched from the API
- Table updates with latest data

#### 22.5 404 Page

**Steps:**

1. Navigate to a non-existent route (e.g., `/nonexistent`)

**Expected Results:**

- Custom 404 page is displayed (`app/not-found.tsx`)

#### 22.6 Application Error Boundary

**Steps:**

1. Trigger a rendering error in a component

**Expected Results:**

- Error boundary catches the error (`app/error.tsx`)
- User-friendly error message is displayed
- Application does not fully crash

#### 22.7 Browser Back/Forward Navigation

**Steps:**

1. Navigate through multiple pages
2. Use browser back button
3. Use browser forward button

**Expected Results:**

- Navigation works correctly with Next.js routing
- State is preserved or re-fetched as appropriate

---

### 23. Cross-Cutting Concerns

#### 23.1 Responsive Layout

**Steps:**

1. Resize browser to various viewport widths
2. Check sidebar, navbar, table, and form layouts

**Expected Results:**

- Layout adapts appropriately (sidebar collapses on small screens)
- Tables remain scrollable

#### 23.2 Data Table Pagination

**Steps:**

1. Navigate to any page with data tables (Instances, Subscriptions, etc.)
2. Verify pagination controls

**Expected Results:**

- Pagination works correctly
- Page size selection (if available) updates the table

#### 23.3 Data Table Sorting

**Steps:**

1. Click column headers in data tables
2. Verify sorting behavior

**Expected Results:**

- Data is sorted by the clicked column
- Sort direction toggles (ascending/descending)

#### 23.4 Copy to Clipboard

**Steps:**

1. Click any "Copy" button (e.g., Instance ID, Subscription ID)

**Expected Results:**

- Value is copied to clipboard
- Visual feedback (e.g., tooltip confirmation)

#### 23.5 Date Formatting

**Steps:**

1. Verify all date fields use UTC formatting

**Expected Results:**

- Dates are displayed consistently using `formatDateUTC` utility
- No timezone confusion

#### 23.6 Loading States

**Steps:**

1. Observe loading behavior when navigating to data-heavy pages

**Expected Results:**

- Loading spinners (`LoadingSpinner`) are shown during data fetch
- No layout shift after data loads

#### 23.7 Snackbar Notifications

**Steps:**

1. Perform operations that trigger success/error messages

**Expected Results:**

- Snackbar appears with appropriate message and severity
- Auto-dismisses after configured duration

---

## Test Infrastructure Notes

### Existing Test Configuration

- **Playwright Config**: [playwright.config.ts](playwright.config.ts) — 12-minute test timeout, 30-second action timeout, 3 workers
- **Test Projects**: `auth-tests` (unauthenticated), `user-setup` (auth bootstrap), `deployment-tests` (authenticated via `storageState`)
- **Page Objects**: [page-objects/](page-objects/) — Reusable UI interaction classes
- **API Clients**: [test-utils/user-api-client.ts](test-utils/user-api-client.ts), [test-utils/provider-api-client.ts](test-utils/provider-api-client.ts)
- **Global State**: [test-utils/global-state-manager.ts](test-utils/global-state-manager.ts) — File-based state sharing between tests

### Environment Variables Required

| Variable                          | Purpose                      |
| --------------------------------- | ---------------------------- |
| `YOUR_SAAS_DOMAIN_URL`            | Base URL for the application |
| `USER_EMAIL`                      | Test user email              |
| `USER_PASSWORD`                   | Test user password           |
| `ENVIRONMENT_TYPE`                | PROD / DEV                   |
| `NEXT_PUBLIC_BACKEND_BASE_DOMAIN` | API backend base URL         |
| `DISABLE_PASSWORD_LOGIN`          | Toggle password login        |
| `BYOA_AWS_ACCOUNT_ID`             | AWS account for BYOA tests   |
| `GOOGLE_RECAPTCHA_SITE_KEY`       | ReCAPTCHA site key           |

### Test Execution Order

1. **Auth Tests** (`auth-tests` project) — Run independently, no auth required
2. **User Setup** (`user-setup` project) — Sign in and save auth state to `playwright/auth/user.json`
3. **Deployment Tests** (`deployment-tests` project) — Use saved auth state, depend on `user-setup`

### Recommended Additional Page Objects

- `SubscriptionsPage` — For subscription management flows
- `BillingPage` — For billing verification
- `SettingsPage` — For settings/profile management
- `AuditLogsPage` — For audit log filtering
- `DashboardPage` — For dashboard chart verification
- `InstanceSnapshotsPage` — For snapshot operations
- `CustomNetworksPage` — Extend existing with full CRUD
- `AccessControlPage` — For user invitation flows

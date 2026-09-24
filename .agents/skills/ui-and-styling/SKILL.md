---
name: ui-and-styling
description: Use when writing or reviewing any customer portal UI in app/, src/components/ or components/ — picking a shared component instead of raw MUI or HTML (Text, Button, Tooltip, FormElementsv2 fields, dialogs, FullScreenDrawer, DataTable, StatusChip, loading spinners, snackbars), colors and theme tokens, white-label branding, typography sizes, Tailwind classes, sx and styled(), CSS modules, SVG ids, conditional rendering with &&, and accessibility. Read it before writing JSX, sx, styled() or className code, or when turning a design into code.
---

# UI and styling

Which component to use, where colors come from, how text is sized, and the layout and accessibility rules. Forms are in `.agents/skills/forms/SKILL.md`, icons in `.agents/skills/icons/SKILL.md`, the feature workflow in `.agents/skills/frontend-feature-development/SKILL.md`.

Counts below are the files that imported each component in September 2026. A big number means "this is the house pattern"; zero means "do not build on it".

## 1. Use the shared component

| Need                             | Use                                                                                                                                                           | Importers           | Not this                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| Any text                         | `Text` from `src/components/Typography/Typography`                                                                                                            | 164 (module)        | MUI `Typography` (14 legacy files), `Box`/`div` with font styles `[no-raw-mui]`         |
| Page heading                     | `PageTitle` from `app/(dashboard)/components/Layout/PageTitle.tsx` inside `PageContainer`                                                                     | 13 / 17             | A hand-sized `h1`                                                                       |
| Other headings                   | `DisplayText`, `H3`, `H5`, `H6`, `P` from the same Typography module                                                                                          |                     | Custom `styled("h2")`                                                                   |
| Button                           | `Button` from `src/components/Button/Button` (`variant` contained, outlined or text; `size`; `isLoading`; `disabledMessage`)                                  | 76                  | MUI `Button`, `<button>` `[no-raw-mui]` `react/forbid-elements`                         |
| Copy to clipboard                | `CopyButton` from `src/components/Button/CopyButton`                                                                                                          | 17                  | A custom copy icon button                                                               |
| Tooltip                          | `Tooltip` (default) or `WhiteTooltip` from `src/components/Tooltip/Tooltip`                                                                                   | 36                  | MUI `Tooltip` (4 legacy files) `[no-raw-mui]`                                           |
| Text input                       | `TextField` from `src/components/FormElementsv2/TextField/TextField`                                                                                          | 26                  | MUI `TextField`, `<input>`                                                              |
| Select                           | `Select` and `MenuItem` from `src/components/FormElementsv2/` (`Select` has `isLoading`)                                                                      | 14 / 13             | MUI `Select`, `<select>`                                                                |
| Password                         | `PasswordField` from `src/components/FormElementsv2/PasswordField/PasswordField`                                                                              | 1                   | A text input with `type="password"` built by hand                                       |
| Autocomplete, radio              | `src/components/FormElementsv2/AutoComplete/AutoComplete`, `src/components/FormElementsv2/Radio/Radio`                                                        | 7 / 3               | MUI `Autocomplete`, `RadioGroup`                                                        |
| Field label, error, spacing      | `FieldTitle`, `FieldError`, `FieldDescription`, `FieldContainer`, `Form` from `src/components/FormElementsv2/`                                                | 8 / 18 / 5 / 10 / 7 | `src/components/FormElements/` (older set, 12 importers)                                |
| Checkbox, switch                 | `src/components/Checkbox/Checkbox`, `src/components/Switch/Switch`                                                                                            | 8 / 5               | MUI `Checkbox`, `Switch`                                                                |
| Tabs                             | `Tabs`, `Tab` from `src/components/Tab/Tab`                                                                                                                   | 7                   | MUI `Tabs`                                                                              |
| Status                           | `StatusChip` from `src/components/StatusChip/StatusChip` (`status`, or `category` plus `label`)                                                               | 41                  | A colored `Chip` or `Box`                                                               |
| Other chips                      | `Chip` from `src/components/Chip/Chip`                                                                                                                        | 7                   | MUI `Chip`                                                                              |
| Table                            | `DataTable` from `src/components/DataTable/DataTable` (TanStack Table); `CursorPaginatedDataTable` for infinite-query event lists                             | 14                  | `@mui/x-data-grid` `DataGrid` (v5, legacy: 3 files), `<table>`                          |
| Table header bar                 | `DataGridHeaderTitle` from `src/components/Headers/DataGridHeaderTitle` plus `RefreshWithToolTip` from `src/components/RefreshWithTooltip/RefreshWithToolTip` | 18 / 13             | A custom title row                                                                      |
| Table cells                      | `DataGridText` from `src/components/DataGrid/DataGridText`, `GridCellExpand` from `src/components/GridCellExpand/GridCellExpand`                              | 6 / 14              | Unstyled strings for long values                                                        |
| Row actions menu                 | `ActionMenu` from `@/components/ActionMenu` (items take `isDisabled`, `disabledMessage`)                                                                      | 2                   | A custom `Menu`                                                                         |
| Type-to-confirm (delete, remove) | `TextConfirmationDialog` from `src/components/TextConfirmationDialog/TextConfirmationDialog`                                                                  | 11                  | MUI `Dialog`                                                                            |
| Confirm with custom content      | `ConfirmationDialog` from `src/components/Dialog/ConfirmationDialog`                                                                                          | 2                   | MUI `Dialog` (14 legacy files)                                                          |
| Info or multi-step dialog        | `InformationDialogTopCenter` from `src/components/Dialog/InformationDialogTopCenter`                                                                          | 6                   | MUI `Dialog`, `Modal`                                                                   |
| Create or modify form            | `FullScreenDrawer` from `app/(dashboard)/components/FullScreenDrawer/FullScreenDrawer.tsx` with `GridDynamicForm`                                             | 5                   | MUI `Drawer`, a new drawer component                                                    |
| Narrow side panel                | `SideDrawerRight` from `src/components/SideDrawerRight/SideDrawerRight`                                                                                       | 0                   | MUI `Drawer` `[no-raw-mui]`; prefer `FullScreenDrawer` for forms                        |
| Page or section loading          | `LoadingSpinner` from `src/components/LoadingSpinner/LoadingSpinner`                                                                                          | 23                  | MUI `CircularProgress` (10 legacy feature files) `[no-raw-mui]`                         |
| Inline loading                   | Default export of `src/components/CircularProgress/CircularProgress` (`LoadingSpinnerSmall`), or `isLoading` on `Button`, `Select`, `DataTable`               | 38                  | MUI `CircularProgress`, raw `Skeleton` (2 legacy files, no wrapper)                     |
| Progress bar                     | `src/components/LinearProgress/LinearProgress`                                                                                                                | 2                   | MUI `LinearProgress`                                                                    |
| Toast                            | `useSnackbar()` from `src/hooks/useSnackbar.js` (`showSuccess`, `showError`, `showInfo`)                                                                      |                     | MUI `Snackbar` or `Alert` (only the providers use them)                                 |
| Inline warning                   | `AlertText` from `src/components/AlertText/AlertText`                                                                                                         | 2                   | MUI `Alert`                                                                             |
| Card or section                  | `CardWithTitle` from `src/components/Card/CardWithTitle`, `Card` from `src/components/Card/Card`                                                              | 11 / 9              | A bordered `Box` with hex borders                                                       |
| Popover, menu, divider, stepper  | `src/components/Popover/Popover`, `src/components/Menu/Menu`, `src/components/Divider/Divider`, `src/components/Stepper/Stepper`                              | 4 / 1 / 2 / 5       | The MUI originals                                                                       |
| Charts                           | `ChartContainer` and friends from `@/components/ui/chart` (Recharts)                                                                                          | 5                   | A second chart library                                                                  |
| Signed-out page pieces           | `src/components/NonDashboardComponents/` (logo, headings, submit button, footer)                                                                              | 18                  | Using them outside `app/(public)/` and `app/not-found.tsx` `[no-auth-shell-components]` |

`[no-raw-mui]` enforces the wrapper for `Button`, `TextField`, `Select`, `MenuItem`, `Menu`, `Tooltip`, `Typography`, `Chip`, `Tabs`, `Tab`, `Checkbox`, `Switch`, `CircularProgress`, `LinearProgress` and `Drawer` everywhere outside `src/components/` and root `components/`. The other rows (dialogs, `Alert`, `Snackbar`, `Skeleton`, `Popover`, `Divider`, `Stepper`) are review rules, not lint rules; follow them anyway.

If nothing fits, extend the closest wrapper in `src/components/` (a new prop) rather than styling a raw MUI component in a feature file. Say so in the PR description.

## 2. Colors and white-label

The brand color is the provider's, not ours. A fork changes it in two places; a hex literal anywhere else stays in the old brand.

| Source                            | What it holds                                                                                                                                           | How code reads it                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `app/globals.css`                 | CSS variables: `--gray-*`, `--success-*`, `--purple-*`, `--error-*`, `--warning-*`, `--blue-*`, and a few more                                          | Through the two entries below                                                            |
| `src/themeConfig.ts`              | `colors` map from token name to `var(--...)`, for example `colors.gray700`, `colors.success600`, `colors.purple600`                                     | `import { colors } from "src/themeConfig";` in `sx`, `styled()` and color props          |
| `tailwind.config.js`              | Tailwind color names mapped to the same variables: purple 50/200/600/700/900, gray 25/50/200-900, success 50/200/500-700, error 50/200/700, warning 200 | Class names in `app/**` files, for example `text-gray-700 border-gray-200 bg-success-50` |
| `src/providerConfig.js`           | `styleConfig`: provider knobs (`primaryColor`, sidebar icon colors)                                                                                     | `import { styleConfig } from "src/providerConfig";`                                      |
| `styles/theme.js`                 | MUI theme used by `app/RootProviders.tsx`; `palette.primary.main` is `styleConfig.primaryColor`                                                         | `sx={{ color: "primary.main" }}` or `useTheme().palette.primary.main`                    |
| `src/constants/statusChipStyles/` | Status palettes for `StatusChip`                                                                                                                        | Through `StatusChip`, never directly in features                                         |

Rules:

- Brand accent: `theme.palette.primary` (which is `styleConfig.primaryColor`). Neutral, success and error colors: `colors.*` or the Tailwind token classes.
- Never write a hex, `rgb()` or named color in feature code; lint rejects hex literals `[no-hex-colors]`. About 300 older files still contain hex colors; they are allowlisted and the list must not grow. The purple brand family alone (`#5925DC`, `#7F56D9`, `#6941C6`, `#9E77ED`, `#F9F5FF` and neighbors) appears 179 times in 86 files, and `#5925DC` itself 3 times outside `src/providerConfig.js`.
- Tailwind classes: use only the steps listed in `tailwind.config.js`. Other steps (`gray-100`, `purple-500`) silently fall back to Tailwind's default palette, not the theme variables, and `warning` or `error` steps that are not listed produce no CSS at all.
- No arbitrary color values in classes, such as `border-[#E9EAEB]` or `shadow-[0_1px_2px_0_#0A0D120D]` (72 occurrences in 43 files today). Use `border-gray-200`.
- Need a color that has no token? Add a CSS variable to `app/globals.css` and a key to `colors` in `src/themeConfig.ts` (and to `tailwind.config.js` if classes need it) in the same PR, and say so in the description.
- Branding text, logos and links: see section 8 of `.agents/skills/frontend-feature-development/SKILL.md`. Never show "Omnistrate" or "SaaS Builder" to end customers.

```tsx
import { colors } from "src/themeConfig";

<Stack sx={{ border: `1px solid ${colors.gray200}`, borderRadius: "12px" }}>
  <Text size="small" weight="medium" color={colors.gray700}>
    {orgName} manages this instance
  </Text>
</Stack>;
```

## 3. Typography

`Text` is MUI `Typography` with the portal's scale. Pick `size` and `weight`; never override `fontSize`, `fontWeight` or `lineHeight` through `sx`, `style` or props `[no-text-font-override]`.

| `size`            | Font size / line height |
| ----------------- | ----------------------- |
| `xsmall`          | 12px / 18px             |
| `small` (default) | 14px / 20px             |
| `medium`          | 16px / 24px             |
| `large`           | 18px / 28px             |
| `xlarge`          | 20px / 30px             |
| `heading`         | 22px / 22px             |

`weight`: `regular` 400, `medium` 500, `semibold` 600 (default), `bold` 700, `extrabold` 800.

- `color` defaults to a hex; pass a token such as `color={colors.gray900}`.
- `mt` and `ml` take numbers (multiples of 8px) or CSS strings. `ellipsis` with `maxWidth` truncates.
- `Text` renders a `<p>`. Inside inline content or around block children pass `component="span"` or `component="div"`.
- Larger type: `DisplayText` (`size` xsmall 24px, small 30px, medium 36px, large 48px, xlarge 60px), `H3`, `H5`, `H6` (`variant` desktop or mobile), `P` (`size` like `Text`, `weight` regular, medium or semibold).
- `Box` or `Stack` is for layout. A `Box` with `fontSize` in `sx` is text styled by hand (about 20 files do this today); use `Text`.

## 4. Styling mechanics

- Prefer, in order: the wrapper's own props, `sx` with tokens, `styled()` with tokens (89 files use `styled()`), Tailwind utility classes for layout in `app/**` files.
- Tailwind only scans `./app/**` (the `content` glob in `tailwind.config.js`). A class used only in `src/components/**` or root `components/**` is not generated unless the same class also appears in `app/`. Today `grid-cols-6` in `src/components/DynamicForm/GridDynamicField.tsx` needs an inline-style fallback and `border-warning-200` in `src/components/ResourceInstance/ResourceInstanceDetails/UpgradeScheduledNotificationBar.tsx` renders nothing. In `src/components/`, style with `sx` and `styled()`.
- Merge conditional classes with `cn()` from `lib/utils.ts`.
- No CSS or SCSS modules and no new global stylesheets `[no-css-modules]`. Three module files exist (`src/components/CookiePolicy/styles.module.css` is the only one imported).
- Spacing and radii: copy the numbers from the nearest existing component (8px radius for controls, 12px for cards and dialogs) rather than inventing new ones.

## 5. JSX and SVG safety

- Never put a non-boolean on the left of `&&` in JSX `react/jsx-no-leaked-render`. `0`, `""` and `NaN` render as text.

```tsx
<>
  {!!count && <Badge count={count} />}
  {items.length > 0 && <List items={items} />}
  {instance?.backupPeriodInHours ? <BackupDetails /> : null}
</>
```

- SVG `<defs>` ids (`clipPath`, `linearGradient`, `mask`, `filter`, `pattern`) come from `useId()`; a hard-coded id breaks when the component renders twice. Five legacy files still hard-code one. Icons built by `yarn icons:build` are already namespaced.
- `dangerouslySetInnerHTML` only with `DOMPurify.sanitize` from `isomorphic-dompurify`, and only for provider or backend HTML that must render as HTML `react/no-danger`.
- Components are arrow functions typed with `FC<Props>`; props and object shapes use `type`, not `interface` (`react/function-component-definition`, `@typescript-eslint/consistent-type-definitions`).

## 6. Accessibility basics

- Interactive elements are `Button`, `next/link`, `MenuItem` or a wrapper, never a `div` with `onClick`. Keyboard users cannot reach a `div`.
- Icon-only buttons get an accessible name: `aria-label` on the button, or `title` on an icon from `src/icons`.
- Every input has a visible label and an accessible name. `FieldTitle` renders plain text, not a `<label>`, so give the input `inputProps={{ "aria-label": "Current password" }}` or pair `id` with `aria-labelledby`.
- Show field errors with `FieldError` directly under the field.
- Images and logos have `alt` text; the provider logo uses `alt={orgName}`.
- Never convey state by color alone. `StatusChip` shows a label; keep it.
- A disabled action keeps its reason in `disabledMessage`.

## 7. Lint guardrails and allowlists

| Guardrail                                                                                                                     | Fix                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[no-raw-mui]`                                                                                                                | Import the wrapper from section 1                                                                                                                               |
| `[no-hex-colors]`                                                                                                             | Use `colors.*`, a Tailwind token class or `theme.palette`                                                                                                       |
| `[no-text-font-override]`                                                                                                     | Change `size` or `weight` on `Text`                                                                                                                             |
| `[no-css-modules]`                                                                                                            | `sx` or `styled()` with tokens                                                                                                                                  |
| `[no-auth-shell-components]`                                                                                                  | Outside `app/(public)/` and `app/not-found.tsx`, use the dashboard components, not `NonDashboardComponents`                                                     |
| `react/forbid-elements`                                                                                                       | `Button`, `TextField`, `Select`, `Checkbox`, `Switch` or `DataTable` instead of the HTML element (allowed only inside `src/components/` and root `components/`) |
| `react/jsx-no-leaked-render`                                                                                                  | `!!value &&`, a comparison, or a ternary                                                                                                                        |
| `react/no-danger`                                                                                                             | Sanitize with `isomorphic-dompurify`; a new HTML sink needs a maintainer's review                                                                               |
| `react/function-component-definition`, `@typescript-eslint/consistent-type-definitions`, `@typescript-eslint/no-explicit-any` | Arrow components, `type` instead of `interface`, a real type or `unknown` instead of `any`                                                                      |
| `no-console`                                                                                                                  | Only `console.warn` and `console.error`, never with tokens or personal data                                                                                     |

Lint runs in CI (the Verify workflow). Files that predate a rule are listed in `eslint.migration-allowlists.cjs`. Lists only shrink: fix the code instead of adding an entry or an `eslint-disable`, and delete a file's entry when you fix it.

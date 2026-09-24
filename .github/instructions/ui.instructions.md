---
applyTo: "app/**/*.tsx,src/**/*.tsx,src/**/*.jsx,components/**/*.tsx"
---

# UI review checklist

Lint already rejects raw MUI where a wrapper exists, raw `button`, `select`, `input`, `textarea` and `table`, hex colors, CSS modules, `Text` font overrides, `react-icons` and leaked `&&` renders. Flag what lint can't see, and name the shared component to use by its path.

## White-label

- Flag "Omnistrate", "SaaS Builder" or any vendor name in customer-facing text, titles, alt text or error messages. The provider's name, logo and support email come from `useProviderOrgDetails()`.
- Flag brand or accent colors hard-coded in any form: Tailwind arbitrary values (`bg-[#...]`, `border-[#...]`), `rgb()`/`rgba()`, named colors, or literal colors passed to third-party widgets. The brand color is `theme.palette.primary`; other colors come from `src/themeConfig.ts`.
- Flag hard-coded support addresses or external links; use the provider's details and `getSafeExternalURL`.

## Hand-rolled shared components

- Flag tables, pagination or row actions built by hand instead of `DataTable` (`src/components/DataTable/DataTable`). New code doesn't use MUI `DataGrid`.
- Flag dialogs built on MUI `Dialog` instead of `TextConfirmationDialog` or `ConfirmationDialog`; destructive actions use type-to-confirm.
- Flag custom side panels instead of `FullScreenDrawer` (`app/(dashboard)/components/FullScreenDrawer/`) or `SideDrawerRight`.
- Flag status pills colored by hand instead of `StatusChip`, and custom spinners instead of `LoadingSpinner` or the `CircularProgress` wrapper.
- Flag text, cards, banners or headers built from `Box` with font sizes, borders and shadows instead of `Text`, `PageTitle` and the shared cards.
- Flag a local copy of a shared component with small changes. Ask for a prop on the shared one instead.

## Behavior and accessibility

- Flag actions hidden from a role instead of disabled with a `disabledMessage` that says why.
- Flag icon-only buttons without `aria-label`, and clickable `Box` or `span` elements instead of `Button` or links.
- Flag drawer and dialog forms where the whole panel scrolls instead of only the content between a fixed header and footer.
- Flag hardcoded ids in hand-written SVG `<defs>` (they need `useId()`).

## Icons and assets

- Flag new icon components or inline `<svg>` icons in route folders, and UI icons added to `public/`. New icons go in `src/icons/svg/` and are generated with `yarn icons:build`.

## Pull request

- Flag visible UI changes without before/after screenshots.

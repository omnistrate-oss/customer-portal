---
name: icons
description: Use when adding, replacing or rendering an icon or small SVG in the customer portal — writing a new icon component in src/components/Icons, reusing icons from src/components/Icons, app/(dashboard)/components/Icons or src/icons, icon size, color and accessibility, react-icons, @mui/icons-material, and cloud or identity provider logos.
---

# Icons

Until the team revisits the icon approach, a new icon is a hand-written React component in `src/components/Icons/`, built the same way as the ones already there. `src/icons/` holds a few generated icons (listed in `src/icons/index.ts`). Use them where they fit, but don't add new icons there for now.

| Do                                                                                                   | Don't                                                                                |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Reuse an icon from `src/components/Icons/`, `app/(dashboard)/components/Icons/` or `src/icons` first | Import from `react-icons` `[no-react-icons]`                                         |
| Add a new icon as `src/components/Icons/<Name>/<Name>Icon.tsx`, typed `FC<SVGIconProps>`             | Put an icon component or inline `<svg>` in a route folder, or a UI icon in `public/` |
| Default the color to `currentColor`; call sites pass a token: `color={colors.gray500}`               | Add new SVGs to `src/icons/svg/` or run `yarn icons:build` for a new icon (paused)   |
| Give an icon-only button or link an `aria-label`                                                     | Leave an icon-only control without an accessible name                                |

## 1. Add an icon

1. Search `src/components/Icons/`, `app/(dashboard)/components/Icons/` and `src/icons/index.ts` first. The icon may already exist.
2. Export the SVG from the design file with "Include viewBox" on.
3. Create `src/components/Icons/<Name>/<Name>Icon.tsx`. Convert the attributes to JSX spelling (`stroke-linecap` becomes `strokeLinecap`), and use `currentColor` so the color can follow the theme:

```tsx
import { FC } from "react";

import { SVGIconProps } from "src/types/common/generalTypes";

const ExampleIcon: FC<SVGIconProps> = ({ color = "currentColor", ...props }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
    <path d="M…" stroke={color} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default ExampleIcon;
```

4. Import it by path: `import ExampleIcon from "src/components/Icons/Example/ExampleIcon";`.

`src/components/Icons/` is exempt from `[no-hex-colors]`, so older icons carry hex defaults. New icons default to `currentColor` instead.

## 2. Color, size and accessibility

- Leave `color` off in most cases. With `currentColor`, the icon follows the surrounding text color, so hover, focus and disabled styles set on the parent reach it.
- When a color is needed, pass a token from `src/themeConfig.ts` (`colors.gray500`) or `theme.palette`, never a hex. Brand accents come from `theme.palette.primary`; see `.agents/skills/ui-and-styling/SKILL.md`.
- Size with `width` and `height`, and keep the `viewBox` so the glyph scales with them.
- Decorative icons are `aria-hidden` (the template sets it). An icon-only button or link needs an `aria-label`.
- When an icon has `<defs>` (`clipPath`, `mask`, gradients, `filter`), take the ids from `useId()`. Hard-coded ids collide when the icon renders twice on a page.
- Generated icons from `src/icons` (`import { Copy02 } from "src/icons"`) take `size`, `color`, `strokeWidth` and `title`, and are `aria-hidden` unless they get a `title`.

## 3. Where icons live

| Location                                                                                                                                                                                                        | Contents                                                                         | Rule                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `src/components/Icons/`                                                                                                                                                                                         | Hand-written components, one folder per icon                                     | Where new icons go. Reuse an existing one first                            |
| `app/(dashboard)/components/Icons/`                                                                                                                                                                             | 21 page and menu icons                                                           | Reuse them; add new ones to `src/components/Icons/`                        |
| Feature `Icons.tsx` files: `app/(dashboard)/billing/components/Icons.tsx`, `app/(dashboard)/payment-methods/components/Icons.tsx`                                                                               | Inline SVG components for one route                                              | No new icons here; add them to `src/components/Icons/`                     |
| `src/icons/`                                                                                                                                                                                                    | Icons generated by `yarn icons:build`                                            | Use them; don't add new ones while the approach is revisited               |
| `app/(dashboard)/components/CloudProviderRadio/`, `app/(dashboard)/components/KubernetesDistributionsMultiSelect/Kubernetes/`, `src/components/Logos/`, `src/components/Stepper/`, `src/components/CodeEditor/` | Logos and component-specific glyphs                                              | Leave in place                                                             |
| `react-icons`                                                                                                                                                                                                   | 2 files import `RiArrowGoBackFill` (the instance and cloud account detail pages) | Banned for new code `[no-react-icons]`; replace when you touch those files |
| `@mui/icons-material`                                                                                                                                                                                           | 58 files, generic glyphs such as close and sort arrows                           | Don't add new usages when an existing icon fits                            |

`src/icons/` and `scripts/build-icons.mjs` are kept in sync with another codebase. If you have to change them, say so in the pull request.

## 4. Logos and brand marks

- Cloud provider logos: reuse the existing maps, `cloudProviderLogoMap` and `cloudProviderLongLogoMap` from `src/constants/cloudProviders.tsx`, and the components in `src/components/Logos/`.
- Identity provider buttons already have their logos under `src/components/Icons/` (Google, GitHub, Okta and others); reuse them.
- The provider's own logo is data, not an icon. Take `orgLogoURL` and `orgName` from `useProviderOrgDetails()` in `src/providers/ProviderOrgDetailsProvider.tsx`, then render `getSafeExternalURL(orgLogoURL)` (`src/utils/getSafeExternalURL.ts`) with `alt={orgName}`; don't copy the `Logo` import in `app/(dashboard)/components/Layout/Navbar.tsx`.
- A new multi-color logo is a design decision; ask a maintainer before adding one.

## 5. Troubleshooting

| Symptom                                          | Cause and fix                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| The icon looks off-center or cropped             | The SVG's `viewBox` is missing or doesn't match the artwork. Re-export it with the viewBox |
| The icon ignores hover, focus or disabled colors | It has a hard-coded fill or stroke. Use `currentColor`, or pass `color` from the call site |
| One of two identical icons renders blank         | Duplicate SVG ids. Take them from `useId()`                                                |
| A few pixels of space below the icon             | The SVG renders inline. Give it `className="block"` or place it in a flex container        |

## 6. Checklist

- [ ] The icon didn't already exist in `src/components/Icons/`, `app/(dashboard)/components/Icons/` or `src/icons`.
- [ ] A new icon is `src/components/Icons/<Name>/<Name>Icon.tsx`, typed `FC<SVGIconProps>`, with a `viewBox`, `currentColor` and `aria-hidden`.
- [ ] Nothing new in `src/icons/`, no `react-icons`, no new `@mui/icons-material` glyph where an existing icon fits.
- [ ] No hex colors at the call site; icon-only controls have an `aria-label`.

---
name: icons
description: Use when adding, replacing or rendering an icon or small SVG in the customer portal — exporting an SVG into src/icons/svg, running yarn icons:build, importing from src/icons, icon size, color, stroke width and accessibility, the legacy icon folders (src/components/Icons, app/(dashboard)/components/Icons, feature Icons.tsx files), react-icons, @mui/icons-material, and cloud or identity provider logos.
---

# Icons

Every new UI icon is an SVG in `src/icons/svg/`, turned into a typed React component by `yarn icons:build`, and imported from `src/icons`. `src/icons/README.md` explains the generator in more depth.

| Do                                                                                                                  | Don't                                                                       |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Save the SVG as `src/icons/svg/<kebab-name>.svg`, run `yarn icons:build`, then `import { Copy02 } from "src/icons"` | Add a file to `src/components/Icons/`; `yarn check:guardrails` fails the PR |
| Commit the SVG and the generated files together                                                                     | Hand-edit a generated `src/icons/<Name>.tsx` or `src/icons/index.ts`        |
| Let the icon inherit `currentColor`, or pass a token: `color={colors.gray500}`                                      | Hard-code a hex fill or stroke                                              |
| Pass `title` when the icon is the only content of a button or link                                                  | Leave an icon-only control without an accessible name                       |
| Ask for the design-system SVG when the icon you need is missing                                                     | Import from `react-icons` `[no-react-icons]`                                |

## 1. Add an icon

1. Export the SVG from the design file with "Include viewBox" on. Name it after the design system's own icon name, in kebab-case: `copy-02.svg`, `arrow-up-right.svg`, `trend-up-01.svg`.
2. Save it to `src/icons/svg/`.
3. Run `yarn icons:build`. It writes one component per SVG (`copy-02.svg` becomes `src/icons/Copy02.tsx`), rewrites the barrel `src/icons/index.ts`, removes components whose SVG was deleted, and runs Prettier and `eslint --fix` on the generated files only.
4. Import from the barrel:

```tsx
import { ArrowUpRight, Copy02 } from "src/icons";

<Copy02 />                        // design size from the viewBox, inherits text color
<Copy02 size={16} />              // scales glyph and stroke together
<ArrowUpRight color={colors.gray500} />
<IconButton aria-label="Copy URL"><Copy02 /></IconButton>
<Copy02 title="Copy URL" />       // icon that carries meaning on its own
```

The build fails when an SVG has no `viewBox` or its name does not convert to a valid component name. Fix the SVG; do not patch the generated file. `src/icons/createIcon.tsx` is the only hand-written file in `src/icons/`.

## 2. What the generator does for you

| In the exported SVG     | Result                                                               |
| ----------------------- | -------------------------------------------------------------------- |
| `stroke="#..."`         | Removed, so the icon strokes with `currentColor`                     |
| `fill="#..."`           | Rewritten to `fill="currentColor"`                                   |
| `stroke-width` on paths | Hoisted to the `<svg>` so the `strokeWidth` prop works               |
| Full-size `<clipPath>`  | Removed                                                              |
| Other ids               | Namespaced per icon, so two icons on one page cannot collide         |
| Attributes              | Converted to JSX spelling (`stroke-linecap` becomes `strokeLinecap`) |

Every icon has the same props (`IconProps` from `src/icons`): `size`, `color`, `strokeWidth`, `title`, a forwarded ref (so it works inside `Tooltip`), and any other SVG attribute. Without `title` the icon is `aria-hidden`.

Because every fill becomes `currentColor`, the pipeline is for single-color UI glyphs. Multi-color marks are not icons (see section 5).

## 3. Color and size

- Leave `color` off in most cases. The icon follows the surrounding text color, so hover, focus and disabled styles set on the parent reach it.
- When a color is needed, pass a token from `src/themeConfig.ts` (`colors.gray500`) or `theme.palette`, never a hex. Brand accents come from `theme.palette.primary`; see `.agents/skills/ui-and-styling/SKILL.md`.
- Use `size` for scaling. Use `strokeWidth` only for optical corrections at unusual sizes.

## 4. Legacy locations: use, don't extend

| Location                                                                                                                                                                                                        | Contents                                                                                        | Rule                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/components/Icons/`                                                                                                                                                                                         | 128 hand-written components in 99 folders, each with its own props and often a hard-coded color | No new files (checked by `yarn check:guardrails`). Reusing an existing one is fine |
| `app/(dashboard)/components/Icons/`                                                                                                                                                                             | 21 page and menu icons                                                                          | No new files                                                                       |
| Feature `Icons.tsx` files: `app/(dashboard)/billing/components/Icons.tsx`, `app/(dashboard)/instance-snapshots/components/Icons.tsx`, `app/(dashboard)/payment-methods/components/Icons.tsx`                    | Inline SVG components for one route                                                             | No new icons here; add them to `src/icons`                                         |
| `app/(dashboard)/components/CloudProviderRadio/`, `app/(dashboard)/components/KubernetesDistributionsMultiSelect/Kubernetes/`, `src/components/Logos/`, `src/components/Stepper/`, `src/components/CodeEditor/` | Logos and component-specific glyphs                                                             | Leave in place                                                                     |
| `react-icons`                                                                                                                                                                                                   | 3 files import `RiArrowGoBackFill` (the instance, snapshot and cloud account detail pages)      | Banned for new code `[no-react-icons]`; replace when you touch those files         |
| `@mui/icons-material`                                                                                                                                                                                           | 58 files, generic glyphs such as close and sort arrows                                          | Do not add new usages when a design-system icon exists; prefer `src/icons`         |

Migrating a legacy icon (only when you are already touching it):

1. Save its SVG to `src/icons/svg/` under the design-system name, not the old component name.
2. Run `yarn icons:build`.
3. Update the call sites. New icons take `size` instead of `width` and `height`, and default to `currentColor` rather than a built-in color, so pass the color or set it on the parent where the old default mattered.
4. Delete the old component once nothing imports it.

Do not bulk-migrate icons. It produces a large diff with no behavior change and a real risk of silently changing a color.

## 5. Logos and brand marks

- Cloud provider logos: reuse the existing maps, `cloudProviderLogoMap` and `cloudProviderLongLogoMap` from `src/constants/cloudProviders.tsx`, and the components in `src/components/Logos/`.
- Identity provider buttons already have their logos under `src/components/Icons/` (Google, GitHub, Okta and others); reuse them.
- The provider's own logo is data, not an icon: render `orgLogoURL` from `useProviderOrgDetails()` with `alt={orgName}` (see `app/(dashboard)/components/Layout/Navbar.tsx`).
- A new multi-color logo is a design decision; ask a maintainer before adding one.

## 6. Troubleshooting

| Symptom                                          | Cause and fix                                                                                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| The icon looks off-center or cropped             | The SVG's `viewBox` is missing or does not match the artwork. Re-export it with the viewBox; the generator refuses SVGs without one              |
| The icon ignores hover, focus or disabled colors | It is a legacy component with a hard-coded fill. Pass `color`, or migrate it (section 4). Generated icons follow `currentColor`                  |
| One of two identical icons renders blank         | Duplicate SVG ids in a legacy component. Generated icons namespace their ids; in hand-written SVG use `useId()`                                  |
| `strokeWidth` has no effect                      | The icon is legacy or its generated file was edited by hand. Regenerate it from `src/icons/svg/`                                                 |
| A few pixels of space below the icon             | Legacy icons render inline. Generated icons set `display: block`                                                                                 |
| Your diff deletes other generated icons          | `src/icons/` mirrors `src/icons/svg/`: an SVG missing from your checkout removes its component. Restore the SVG and run `yarn icons:build` again |

## 7. Checklist

- [ ] The SVG is in `src/icons/svg/`, named in kebab-case after the design system, with a `viewBox`.
- [ ] `yarn icons:build` was run and its output is committed with the SVG.
- [ ] No new files in the legacy folders, no `react-icons`, no new `@mui/icons-material` glyph where a design-system icon exists.
- [ ] No hex colors on icons; icon-only controls have an `aria-label` or the icon has a `title`.

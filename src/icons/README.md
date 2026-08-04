# Icons

One icon, one API. `size`, `color`, `strokeWidth`, a forwarded ref, and correct
accessibility defaults — the same for every icon, generated from the design system's SVG
exports so the code and the Figma library cannot drift.

```tsx
import { Copy02 } from "src/icons";

<Copy02 />                                  // 20×20, inherits text color
<Copy02 size={16} />                        // any size
<Copy02 color="#CECFD2" />                  // explicit color
<Copy02 title="Copy URL" />                 // icon-only button: give it a name
<Box sx={{ color: "#717680", "&:hover": { color: "#414651" } }}>
  <Copy02 />                                {/* colour follows CSS, no props needed */}
</Box>
```

## Adding an icon

1. Export it from Figma as SVG and save it to `src/icons/svg/` **using the design system's
   own name**, in kebab-case: `copy-02.svg`, `arrow-up-right.svg`.
2. `yarn icons:build`
3. Import it: `copy-02.svg` → `import { Copy02 } from "src/icons"`.

The file name is the contract. Each hyphen-separated part is capitalised and joined, so the
name you see in Figma is the name you type in the editor. Deleting an SVG and re-running
removes its component.

Everything in this directory is generated except `createIcon.tsx`. Don't hand-edit an icon
file — replace the SVG and re-run.

## What the generator normalises

Figma exports are not usable as-is. The generator fixes the things that otherwise become
bugs:

| Export contains             | Why it breaks                                                                                                                                                                             | What we do                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `stroke="#CECFD2"`          | Colour is frozen; hover/disabled states can't reach it                                                                                                                                    | Dropped, so it inherits `currentColor`             |
| `fill="#CECFD2"`            | Same                                                                                                                                                                                      | Rewritten to `currentColor`                        |
| `stroke-width` on each path | A path attribute beats the `<svg>`, so the prop silently does nothing                                                                                                                     | Hoisted onto the `<svg>` as the default            |
| A full-bleed `<clipPath>`   | Dead weight, and its `id` is global                                                                                                                                                       | Removed — it clips to the viewBox, i.e. to nothing |
| Any other `id`              | Two icons on one page can collide and one renders blank                                                                                                                                   | Namespaced per icon                                |
| Missing `viewBox`           | **The real cause of "the icon looks off-centre"** — the artwork draws at its authored size in the top-left of a differently-sized box, and no amount of flexbox on the parent will fix it | Required; the build fails without one              |

## Sizing and colour

`size` defaults to the icon's own design size, read from its viewBox — a bare `<Copy02 />`
renders exactly as drawn. Passing `size` scales the glyph and its stroke together, which is
what you want; reach for `strokeWidth` only for optical corrections at extreme sizes.

`color` maps onto the SVG's `color` property, which `currentColor` resolves against. Leaving
it off is usually right: the icon then follows the surrounding text colour, so hover, focus
and disabled states work through CSS instead of prop drilling.

## Accessibility

Icons are `aria-hidden` by default. That is correct for the common case — an icon next to a
visible label, where announcing it again is noise. When the icon carries the meaning on its
own (an icon-only button), pass `title`, which switches it to `role="img"` with an
accessible name.

## Migrating from `src/components/Icons`

The 87 components in `src/components/Icons` predate this and each define their own props.
They still work; nothing needs to move on a deadline. When you touch one, consider bringing
it over:

1. Save the SVG to `src/icons/svg/` under its design-system name (not the old component
   name — `ArrowExternal` is `arrow-up-right` in Figma).
2. `yarn icons:build`.
3. Update the call sites. Watch for two differences: the new icons take `size` rather than
   separate `width`/`height` (both still work), and `color` now defaults to `currentColor`
   rather than a hardcoded brand colour — a call site that relied on the old default needs
   the colour passed explicitly or set on a parent.
4. Delete the old directory once nothing imports it.

Don't move an icon just to move it. Bulk-migrating means a large diff with no behaviour
change and a real chance of quietly altering a colour somewhere.

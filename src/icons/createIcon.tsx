import { forwardRef, ReactNode, SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "color" | "strokeWidth"> & {
  /**
   * Width and height. Defaults to the icon's design size, taken from its viewBox, so an
   * unstyled icon always renders at the size it was drawn at.
   */
  size?: number | string;
  /**
   * Any CSS color. Defaults to `currentColor`, so an icon with no `color` inherits the
   * surrounding text color — including on hover, focus and disabled states, without
   * threading a prop through.
   */
  color?: string;
  /** Stroke weight override, for optical adjustments at unusual sizes. */
  strokeWidth?: number | string;
  /**
   * Accessible name. Omit it for icons that sit next to a visible text label — the icon is
   * then hidden from assistive tech, which is what you want. Set it when the icon is the
   * only thing conveying meaning, e.g. an icon-only button.
   */
  title?: string;
};

type IconDefinition = {
  name: string;
  viewBox: string;
  strokeWidth?: number;
  children: ReactNode;
};

const DEFAULT_SIZE = 24;

const getDesignSize = (viewBox: string): number => {
  const width = Number(viewBox.trim().split(/\s+/)[2]);
  return Number.isFinite(width) && width > 0 ? width : DEFAULT_SIZE;
};

/**
 * Builds an icon component from a design export. Generated icon files call this; it is the
 * only hand-written file in `src/icons`.
 *
 * Every icon gets the same contract: `size` scales it, `color` maps onto `currentColor`,
 * `strokeWidth` is overridable, a ref reaches the `<svg>` (so MUI Tooltip and friends work),
 * and anything else lands on the `<svg>` element.
 */
export const createIcon = ({ name, viewBox, strokeWidth: designStrokeWidth, children }: IconDefinition) => {
  const designSize = getDesignSize(viewBox);

  const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
    { size = designSize, color, strokeWidth = designStrokeWidth, title, style, ...rest },
    ref
  ) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        color={color}
        role={title ? "img" : undefined}
        aria-hidden={title ? undefined : true}
        focusable="false"
        // Block layout keeps the glyph off the text baseline, which is what otherwise leaves
        // a few pixels of descender space under an icon and makes it look off-centre.
        style={{ display: "block", ...style }}
        {...rest}
      >
        {title ? <title>{title}</title> : null}
        {children}
      </svg>
    );
  });

  Icon.displayName = name;

  return Icon;
};

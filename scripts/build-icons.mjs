#!/usr/bin/env node
/**
 * Turns the design system's SVG exports into typed React components.
 *
 *   yarn icons:build
 *
 * Drop a Figma export into src/icons/svg/<kebab-name>.svg and re-run. The file name is the
 * contract: `copy-02.svg` becomes `<Copy02 />`, exported from `src/icons`. Every .tsx in
 * src/icons except createIcon.tsx is generated and will be overwritten.
 *
 * What it normalises, and why:
 *   - hardcoded stroke colors are dropped so the icon inherits `currentColor`
 *   - hardcoded fill colors become `currentColor` (solid icons keep their shape)
 *   - stroke-width is hoisted onto the <svg> so the `strokeWidth` prop can override it
 *   - Figma's no-op full-bleed clipPath is removed; any surviving ids are namespaced per
 *     icon so two icons on one page cannot collide
 *   - SVG attributes are rewritten to their JSX spelling
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ICONS_DIR = join(REPO_ROOT, "src", "icons");
const SVG_DIR = join(ICONS_DIR, "svg");
const RUNTIME_FILE = "createIcon.tsx";

const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
};

const toPascalCase = (kebabName) =>
  kebabName
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");

/** Strips Figma's full-bleed clipPath, which clips to the viewBox and so does nothing. */
const removeNoOpClipPath = (markup, viewBoxWidth, viewBoxHeight) => {
  let result = markup;

  for (const defs of markup.match(/<defs>[\s\S]*?<\/defs>/g) ?? []) {
    const clipPaths = defs.match(/<clipPath[^>]*>[\s\S]*?<\/clipPath>/g) ?? [];
    if (clipPaths.length === 0) continue;

    const removableIds = [];
    for (const clipPath of clipPaths) {
      const id = clipPath.match(/id="([^"]+)"/)?.[1];
      const rects = clipPath.match(/<rect\b[^>]*\/?>/g) ?? [];
      if (!id || rects.length !== 1) continue;

      const rect = rects[0];
      const width = Number(rect.match(/\bwidth="([^"]+)"/)?.[1]);
      const height = Number(rect.match(/\bheight="([^"]+)"/)?.[1]);
      const x = Number(rect.match(/\bx="([^"]+)"/)?.[1] ?? 0);
      const y = Number(rect.match(/\by="([^"]+)"/)?.[1] ?? 0);
      const isRounded = /\br[xy]="/.test(rect);

      if (width === viewBoxWidth && height === viewBoxHeight && x === 0 && y === 0 && !isRounded) {
        removableIds.push(id);
      }
    }

    if (removableIds.length !== clipPaths.length) continue;

    result = result.replace(defs, "");
    for (const id of removableIds) {
      result = result.replace(new RegExp(`\\s*clip-path="url\\(#${id}\\)"`, "g"), "");
    }
  }

  // Unwrap <g> elements left with no attributes once their clip-path is gone.
  let previous;
  do {
    previous = result;
    result = result.replace(/<g\s*>([\s\S]*?)<\/g>/g, "$1");
  } while (result !== previous);

  return result;
};

/** Namespaces remaining ids so gradients and masks cannot collide across icons. */
const namespaceIds = (markup, kebabName) => {
  const idMap = new Map();
  let index = 0;

  let result = markup.replace(/id="([^"]+)"/g, (_match, id) => {
    const namespaced = `${kebabName}-${index++}`;
    idMap.set(id, namespaced);
    return `id="${namespaced}"`;
  });

  if (idMap.size === 0) return result;

  result = result.replace(/url\(#([^)]+)\)/g, (match, id) => (idMap.has(id) ? `url(#${idMap.get(id)})` : match));
  result = result.replace(/href="#([^"]+)"/g, (match, id) => (idMap.has(id) ? `href="#${idMap.get(id)}"` : match));

  return result;
};

const toJsxAttributes = (markup) => {
  let previous;
  let result = markup;
  do {
    previous = result;
    result = result.replace(
      /\s([a-z]+)-([a-z]+)=/g,
      (_match, head, tail) => ` ${head}${tail[0].toUpperCase()}${tail.slice(1)}=`
    );
  } while (result !== previous);
  return result;
};

const buildIcon = (fileName) => {
  const kebabName = fileName.replace(/\.svg$/, "");
  const componentName = toPascalCase(kebabName);

  if (!/^[A-Z][A-Za-z0-9]*$/.test(componentName)) {
    fail(
      `${fileName}: "${componentName}" is not a valid component name. Rename the file to kebab-case letters/digits.`
    );
    return null;
  }

  const source = readFileSync(join(SVG_DIR, fileName), "utf8");
  const viewBox = source.match(/viewBox="([^"]+)"/)?.[1];

  if (!viewBox) {
    fail(
      `${fileName}: no viewBox. Re-export from Figma with "Include viewBox" enabled — without it the artwork cannot be scaled or centred.`
    );
    return null;
  }

  const [, , viewBoxWidth, viewBoxHeight] = viewBox.trim().split(/\s+/).map(Number);

  let markup = source
    .replace(/^[\s\S]*?<svg\b[^>]*>/, "")
    .replace(/<\/svg>[\s\S]*$/, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  markup = removeNoOpClipPath(markup, viewBoxWidth, viewBoxHeight);
  markup = namespaceIds(markup, kebabName);

  const strokeWidth = Number(markup.match(/stroke-width="([^"]+)"/)?.[1]);
  markup = markup
    .replace(/\sstroke-width="[^"]*"/g, "")
    .replace(/\sstroke="(?!none)[^"]*"/g, "")
    .replace(/\sfill="(?!none)[^"]*"/g, ' fill="currentColor"');

  markup = toJsxAttributes(markup).trim();

  const strokeWidthLine = Number.isFinite(strokeWidth) ? `  strokeWidth: ${strokeWidth},\n` : "";

  const contents = `// AUTO-GENERATED by \`yarn icons:build\` from src/icons/svg/${fileName}. Do not edit.
import { createIcon } from "./createIcon";

export default createIcon({
  name: "${componentName}",
  viewBox: "${viewBox}",
${strokeWidthLine}  children: (
    <>
      ${markup}
    </>
  ),
});
`;

  writeFileSync(join(ICONS_DIR, `${componentName}.tsx`), contents);

  return componentName;
};

if (!existsSync(SVG_DIR)) {
  mkdirSync(SVG_DIR, { recursive: true });
}

const svgFiles = readdirSync(SVG_DIR)
  .filter((file) => file.endsWith(".svg"))
  .sort();

const componentNames = svgFiles.map(buildIcon).filter(Boolean);

// Drop components whose SVG has been removed, so the directory always mirrors svg/.
for (const file of readdirSync(ICONS_DIR)) {
  if (!file.endsWith(".tsx") || file === RUNTIME_FILE) continue;
  if (!componentNames.includes(file.replace(/\.tsx$/, ""))) {
    rmSync(join(ICONS_DIR, file));
    console.log(`  - ${file} (source SVG removed)`);
  }
}

const barrel = `// AUTO-GENERATED by \`yarn icons:build\`. Do not edit.
export { createIcon } from "./createIcon";
export type { IconProps } from "./createIcon";

${componentNames.map((name) => `export { default as ${name} } from "./${name}";`).join("\n")}
`;

writeFileSync(join(ICONS_DIR, "index.ts"), barrel);

// Hand the output to the repo's own formatter and linter, so generated files obey the same
// rules as everything else and never show up as noise in review.
const written = [...componentNames.map((name) => `src/icons/${name}.tsx`), "src/icons/index.ts"];
execFileSync("npx", ["prettier", "--write", "--log-level", "warn", ...written], { cwd: REPO_ROOT, stdio: "inherit" });

try {
  execFileSync("npx", ["eslint", "--fix", ...written], { cwd: REPO_ROOT, stdio: "inherit" });
} catch {
  console.warn("  ! eslint --fix could not run on the generated files; run the repo's lint task manually.");
}

for (const [index, name] of componentNames.entries()) {
  console.log(`  ✓ ${name}  (from ${svgFiles[index]})`);
}
console.log(`\n${componentNames.length} icon(s) written to src/icons`);

// Shared byte for byte with the customer portal (src/components/ColumnPreference/columnLayout.ts in
// omnistrate-oss/customer-portal). Change both copies together; the tests live in omnistrate-cloud-ui.

/**
 * utility: no header label (checkbox, row icons, expand arrow). Not listed; keeps its slot.
 * primary: opens the row. Keeps its slot and is always shown.
 * locked: has links or actions. Movable and always shown.
 * optional: movable and hideable.
 */
export type ColumnKind = "utility" | "primary" | "locked" | "optional";

export type ColumnRule = { id: string; kind: ColumnKind };

/** The movable column ids in display order (hidden ones included), and the hidden ids. */
export type ColumnLayout = { order: string[]; hidden: string[] };

export type ResolvedColumnLayout = { layout: ColumnLayout; orderedIds: string[] };

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isMovable = (rule: ColumnRule): boolean => rule.kind === "locked" || rule.kind === "optional";

const isSameOrder = (first: readonly string[], second: readonly string[]): boolean =>
  first.length === second.length && first.every((id, index) => id === second[index]);

/** Returns the saved layout, or null when the entry is missing, corrupt or the wrong shape. */
export const parseColumnLayout = (raw: string | null): ColumnLayout | null => {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null || !("order" in value) || !("hidden" in value)) return null;
    return isStringArray(value.order) && isStringArray(value.hidden)
      ? { order: value.order, hidden: value.hidden }
      : null;
  } catch {
    return null;
  }
};

/**
 * Applies a saved layout to the current columns. Primary and utility columns keep their default slot, and the
 * movable columns fill the remaining slots in the saved order. Saved ids that no longer exist are dropped, and a
 * column the saved layout doesn't know yet goes right after its default predecessor.
 *
 * resolveColumnLayout([check (utility), id (primary), a, b, c], { order: ["c", "a"], hidden: ["a"] })
 * → { layout: { order: ["c", "a", "b"], hidden: ["a"] }, orderedIds: ["check", "id", "c", "a", "b"] }
 */
export const resolveColumnLayout = (rules: readonly ColumnRule[], saved: ColumnLayout | null): ResolvedColumnLayout => {
  const movableIds = rules.filter(isMovable).map((rule) => rule.id);
  const order = [...new Set(saved?.order ?? [])].filter((id) => movableIds.includes(id));
  movableIds.forEach((id, index) => {
    if (order.includes(id)) return;
    const predecessor = movableIds
      .slice(0, index)
      .reverse()
      .find((previousId) => order.includes(previousId));
    order.splice(predecessor === undefined ? 0 : order.indexOf(predecessor) + 1, 0, id);
  });

  const optionalIds = rules.filter((rule) => rule.kind === "optional").map((rule) => rule.id);
  const hidden = [...new Set(saved?.hidden ?? [])].filter((id) => optionalIds.includes(id));
  const hasAlwaysShownColumn = rules.some((rule) => rule.kind === "primary" || rule.kind === "locked");
  const hidesEveryColumn = !hasAlwaysShownColumn && optionalIds.length > 0 && hidden.length === optionalIds.length;

  let nextMovable = 0;
  const orderedIds = rules.map((rule) => (isMovable(rule) ? order[nextMovable++] : rule.id));

  return { layout: { order, hidden: hidesEveryColumn ? [] : hidden }, orderedIds };
};

/**
 * Returns the value to store, or null when the layout matches the default, so the entry is removed and later
 * changes to the default still apply. Hidden ids of columns that aren't present right now (another plan's
 * metrics, a column that only shows for some rows) are kept.
 *
 * toStoredColumnLayout({ order: ["a", "b"], hidden: ["b"] }, { order: ["a", "b"], hidden: [] }, { order: [], hidden: ["x"] })
 * → '{"order":["a","b"],"hidden":["b","x"]}'
 */
export const toStoredColumnLayout = (
  next: ColumnLayout,
  defaults: ColumnLayout,
  previous: ColumnLayout | null
): string | null => {
  if (next.hidden.length === 0 && isSameOrder(next.order, defaults.order)) return null;
  const absentHidden = (previous?.hidden ?? []).filter((id) => !defaults.order.includes(id));
  return JSON.stringify({ order: next.order, hidden: [...new Set([...next.hidden, ...absentHidden])] });
};

/** moveItem(["a", "b", "c"], 0, 2) → ["b", "c", "a"] */
export const moveItem = <T>(items: readonly T[], from: number, to: number): T[] => {
  const next = [...items];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
};

const KEY_PREFIX = "columnPreferences:v1:";
const listeners = new Set<() => void>();
// Values localStorage refused to save (blocked or full), kept for the rest of the session.
const unsavedValues = new Map<string, string | null>();

/** getColumnLayoutKey("user-1", "apiKeys") → "columnPreferences:v1:user-1:apiKeys" */
export const getColumnLayoutKey = (userId: string, tableId: string): string => `${KEY_PREFIX}${userId}:${tableId}`;

export const readStoredColumnLayout = (key: string): string | null => {
  if (unsavedValues.has(key)) return unsavedValues.get(key) ?? null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeStoredColumnLayout = (key: string, value: string | null): void => {
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
    unsavedValues.delete(key);
  } catch {
    unsavedValues.set(key, value);
  }
  listeners.forEach((listener) => listener());
};

/** Notifies on writes in this tab and on column-layout writes in other tabs. Pass it to useSyncExternalStore. */
export const subscribeToStoredColumnLayouts = (listener: () => void): (() => void) => {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(KEY_PREFIX)) listener();
  };
  listeners.add(listener);
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
};

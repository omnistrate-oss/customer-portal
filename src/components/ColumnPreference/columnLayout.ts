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

const isSameSet = (first: readonly string[], second: readonly string[]): boolean => {
  const firstIds = new Set(first);
  return firstIds.size === new Set(second).size && second.every((id) => firstIds.has(id));
};

// Puts each id of `reference` that `include` accepts and `order` lacks right after the id it follows in `reference`.
const insertMissingIds = (order: string[], reference: readonly string[], include: (id: string) => boolean): void => {
  reference.forEach((id, index) => {
    if (order.includes(id) || !include(id)) return;
    const predecessor = reference
      .slice(0, index)
      .reverse()
      .find((previousId) => order.includes(previousId));
    order.splice(predecessor === undefined ? 0 : order.indexOf(predecessor) + 1, 0, id);
  });
};

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
  insertMissingIds(order, movableIds, () => true);

  const optionalIds = rules.filter((rule) => rule.kind === "optional").map((rule) => rule.id);
  const hidden = [...new Set(saved?.hidden ?? [])].filter((id) => optionalIds.includes(id));
  const hasAlwaysShownColumn = rules.some((rule) => rule.kind === "primary" || rule.kind === "locked");
  const hidesEveryColumn = !hasAlwaysShownColumn && optionalIds.length > 0 && hidden.length === optionalIds.length;

  let nextMovable = 0;
  const orderedIds = rules.map((rule) => (isMovable(rule) ? order[nextMovable++] : rule.id));

  return { layout: { order, hidden: hidesEveryColumn ? [] : hidden }, orderedIds };
};

/**
 * Returns the value to store, or null when the layout matches the default order and hidden columns and no column
 * that's absent right now is remembered, so the entry is removed and later changes to the default still apply.
 * Columns that aren't present right now (another plan's metrics, a column that only shows for some rows) keep their
 * saved place, after the column they followed, and stay hidden if they were.
 *
 * toStoredColumnLayout({ order: ["b", "a"], hidden: [] }, { order: ["a", "b"], hidden: [] }, { order: ["a", "x", "b"], hidden: ["x"] })
 * → '{"order":["b","a","x"],"hidden":["x"]}'
 */
export const toStoredColumnLayout = (
  next: ColumnLayout,
  defaults: ColumnLayout,
  previous: ColumnLayout | null
): string | null => {
  const isAbsent = (id: string) => !defaults.order.includes(id);
  const absentHidden = (previous?.hidden ?? []).filter(isAbsent);
  const order = [...next.order];
  insertMissingIds(order, previous?.order ?? [], isAbsent);
  const isDefault = isSameOrder(next.order, defaults.order) && isSameSet(next.hidden, defaults.hidden);
  if (isDefault && !absentHidden.length && order.length === next.order.length) return null;
  return JSON.stringify({ order, hidden: [...new Set([...next.hidden, ...absentHidden])] });
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

/**
 * getColumnLayoutKey("user-1", "apiKeys") → "columnPreferences:v1:user-1:apiKeys"
 * getColumnLayoutKey("user-1", "customers", 2) → "columnPreferences:v1:user-1:customers@2"
 */
export const getColumnLayoutKey = (userId: string, tableId: string, tableVersion = 1): string =>
  `${KEY_PREFIX}${userId}:${tableId}${tableVersion > 1 ? `@${tableVersion}` : ""}`;

/** Deletes the user's saved layouts whose key isn't in `currentKeys`: older table versions and removed tables. */
export const pruneStoredColumnLayouts = (userId: string, currentKeys: ReadonlySet<string>): void => {
  const userPrefix = `${KEY_PREFIX}${userId}:`;
  try {
    const staleKeys = Array.from({ length: window.localStorage.length }, (_, index) =>
      window.localStorage.key(index)
    ).filter((key): key is string => !!key?.startsWith(userPrefix) && !currentKeys.has(key));
    staleKeys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage is blocked, so nothing was saved there to delete.
  }
};

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

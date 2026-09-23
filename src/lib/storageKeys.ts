/**
 * Every key this site keeps in the browser, and the one-time move from the names they had
 * before the site was called Nitora Trading Academy.
 *
 * The keys live here, and the stores import them from here, for an ordering reason rather
 * than a tidiness one. A store reads storage the moment it is created, which is at import
 * time. A module is always evaluated before any module that imports it, so importing a key
 * from this file guarantees the migration at the bottom has already run by the time anything
 * reads. Put the migration anywhere else and it would depend on the order of import lines in
 * main.tsx, which nobody editing main.tsx would know to preserve.
 */
export const STORAGE_KEYS = {
  theme: 'nitora-theme',
  progress: 'nitora-progress-v1',
  sim: 'nitora-sim-v1',
} as const;

/**
 * Old name, then new name. The old names date from when the site was TradeLab Academy.
 *
 * These hold a reader's lesson progress, their trade journal and their open simulator
 * session. Renaming a key without moving its value would silently wipe all three, which is
 * why they are moved rather than abandoned.
 */
export const LEGACY_KEYS: ReadonlyArray<readonly [string, string]> = [
  ['tradelab-theme', STORAGE_KEYS.theme],
  ['tradelab-progress-v1', STORAGE_KEYS.progress],
  ['tradelab-sim-v1', STORAGE_KEYS.sim],
];

/**
 * Preferences added after the rename. They never had an old name, so they are kept apart from
 * STORAGE_KEYS, whose every entry the migration below must account for.
 */
export const PREF_KEYS = {
  /** "read" or "present": how the reader last chose to view lessons. */
  lessonMode: 'nitora-lesson-mode',
} as const;

/** The part of Storage the migration uses, so a test can hand it a plain object. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Move each legacy key to its new name, and return the old names that moved.
 *
 * One rule: nothing is destroyed that was not first copied. A value is copied only into an
 * empty new key, so a value already there is never overwritten. The old key is removed only
 * after the copy has been read back, so a write that failed — a full quota, a blocked
 * storage — leaves the original exactly where it was, and the next load simply tries again.
 *
 * When both names already hold something, both are left alone. The site only ever reads the
 * new one, so the old copy is inert; deleting it would be destroying data to tidy up.
 */
export function migrateStorage(store: KeyValueStore): string[] {
  const moved: string[] = [];
  for (const [from, to] of LEGACY_KEYS) {
    try {
      const value = store.getItem(from);
      if (value === null) continue;
      if (store.getItem(to) !== null) continue;
      store.setItem(to, value);
      if (store.getItem(to) !== value) continue;
      store.removeItem(from);
      moved.push(from);
    } catch {
      // One unreadable key must not stop the others, and must never take the site down.
    }
  }
  return moved;
}

// Runs once, when this module is first evaluated: before any store that imports a key.
try {
  if (typeof localStorage !== 'undefined') migrateStorage(localStorage);
} catch {
  // Touching localStorage throws in some private windows and with site data blocked. The site
  // still works there; it just cannot remember anything, migrated or not.
}

/** Single versioned browser store for Minarah preferences and progress. */
const STORE_KEY = 'minarah-local-v1';
type Store = { version: 1; values: Record<string, string> };

const LEGACY_KEYS = [
  'theme', 'mode', 'muslim-life-location', 'muslim-life-reminders',
  'muslim-life-default-reciter', 'muslim-life-quran-bookmark', 'muslim-life-quran-settings',
  'muslim-life-ramadan-mode', 'muslim-life-notifications', 'muslim-life-notification-time',
  'muslim-life-last-notification-date', 'minarah-kids-progress', 'minarah-user-settings',
  'minarah-favorites', 'minarah-collections', 'minarah-prayer-config', 'minarah-kids-name',
];

function readStore(): Store {
  if (typeof window === 'undefined') return { version: 1, values: {} };
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Store;
      if (parsed?.version === 1 && parsed.values && typeof parsed.values === 'object') return parsed;
      window.localStorage.setItem('minarah-corrupt-v1', raw);
    }
  } catch {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) window.localStorage.setItem('minarah-corrupt-v1', raw);
    } catch { /* Preserve best effort if browser storage is blocked. */ }
  }
  const values: Record<string, string> = {};
  // Capture prior Minarah and mode-specific keys, including date-based progress keys.
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || key === STORE_KEY || key === 'minarah-corrupt-v1') continue;
      const value = window.localStorage.getItem(key);
      if (value !== null) values[key] = value;
    }
  } catch { /* Continue with known keys if storage enumeration is unavailable. */ }
  for (const key of LEGACY_KEYS) {
    try {
      const value = window.localStorage.getItem(key);
      if (value !== null) values[key] = value;
    } catch { /* Ignore inaccessible legacy values. */ }
  }
  const store: Store = { version: 1, values };
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch { /* surfaced on writes */ }
  return store;
}

function writeStore(store: Store) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export const localState = {
  getItem(key: string): string | null { return readStore().values[key] ?? null; },
  setItem(key: string, value: string): void {
    const store = readStore(); store.values[key] = value; writeStore(store);
  },
  removeItem(key: string): void {
    const store = readStore(); delete store.values[key]; writeStore(store);
  },
  exportBackup(): string { return JSON.stringify(readStore(), null, 2); },
  importBackup(raw: string): void {
    const parsed = JSON.parse(raw) as Store;
    if (parsed?.version !== 1 || !parsed.values || typeof parsed.values !== 'object' || Array.isArray(parsed.values)) {
      throw new Error('Format de sauvegarde Minarah non reconnu.');
    }
    for (const value of Object.values(parsed.values)) if (typeof value !== 'string') throw new Error('Sauvegarde invalide.');
    writeStore(parsed);
  },
};

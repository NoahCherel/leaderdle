import { initialState, type GameState } from './state';

export const STORAGE_KEY = 'leaderdle';

interface Backend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface Store {
  load(): GameState;
  save(state: GameState): void;
}

const valid = (d: unknown): d is GameState =>
  !!d && typeof d === 'object' && (d as GameState).v === 2 && typeof (d as GameState).days === 'object' && !!(d as GameState).stats;

/**
 * Saves the game in the browser. When storage is blocked (private browsing, disabled cookies)
 * the game keeps its state in memory for the session (PASSATION §12).
 */
export function createStorage(backend: Backend | null): Store {
  let memory: string | null = null;
  let last: string | null = null;

  const read = (): string | null => {
    if (backend) {
      try {
        const raw = backend.getItem(STORAGE_KEY);
        if (raw !== null) return raw;
      } catch {
        /* fall through to memory */
      }
    }
    return memory;
  };

  return {
    load() {
      const raw = read();
      if (!raw) return initialState();
      try {
        const data: unknown = JSON.parse(raw);
        if (!valid(data)) return initialState();
        const base = initialState();
        return { ...base, ...data, settings: { ...base.settings, ...data.settings }, stats: { ...base.stats, ...data.stats } };
      } catch {
        return initialState();
      }
    },
    save(state) {
      const raw = JSON.stringify(state);
      if (raw === last) return;
      last = raw;
      memory = raw;
      if (!backend) return;
      try {
        backend.setItem(STORAGE_KEY, raw);
      } catch {
        /* memory copy already updated */
      }
    },
  };
}

export function browserStorage(): Backend | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

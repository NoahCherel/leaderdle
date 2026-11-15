import { createStorage, STORAGE_KEY } from './storage';
import { initialState } from './state';

const fakeStorage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  };
};

const throwing = {
  getItem: () => { throw new Error('denied'); },
  setItem: () => { throw new Error('denied'); },
  removeItem: () => { throw new Error('denied'); },
};

describe('storage', () => {
  it('returns a fresh state when nothing is saved', () => {
    expect(createStorage(fakeStorage()).load()).toEqual(initialState());
  });

  it('round-trips the state', () => {
    const backend = fakeStorage();
    const store = createStorage(backend);
    const s = { ...initialState(), settings: { dark: true, cb: false, reduce: true } };
    store.save(s);
    expect(backend.data.has(STORAGE_KEY)).toBe(true);
    expect(createStorage(backend).load()).toEqual(s);
  });

  it('ignores corrupt or foreign data', () => {
    const backend = fakeStorage();
    backend.setItem(STORAGE_KEY, '{not json');
    expect(createStorage(backend).load()).toEqual(initialState());
    backend.setItem(STORAGE_KEY, JSON.stringify({ v: 99 }));
    expect(createStorage(backend).load()).toEqual(initialState());
  });

  it('keeps working in memory when storage is unavailable', () => {
    const store = createStorage(throwing);
    const s = { ...initialState(), consent: 'yes' as const };
    expect(() => store.save(s)).not.toThrow();
    expect(store.load()).toEqual(s);
  });

  it('works with no storage at all', () => {
    const store = createStorage(null);
    store.save({ ...initialState(), consent: 'no' });
    expect(store.load().consent).toBe('no');
  });
});

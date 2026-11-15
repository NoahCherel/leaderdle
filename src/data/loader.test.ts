import { loadGame } from './loader';
import { initialState, reducer } from '../store/state';
import { SAMPLE_LEADERS } from '../game/fixtures';
import type { DayPuzzle } from './schema';

const puzzle: DayPuzzle = {
  n: 128,
  classic: { answer: 'mer' },
  succession: { before: 'tha', answer: 'mer', after: 'ard', years: '2005 – 2021', beforeYears: '1979 – 1990', afterYears: '2017 – 2023' },
  timeline: { order: ['lky', 'tha', 'man', 'mer', 'ard'], start: ['man', 'ard', 'lky', 'mer', 'tha'] },
};
const leadersFile = { version: 1, leaders: SAMPLE_LEADERS };

const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));

const fakeFetch = (routes: Record<string, () => Promise<Response>>) =>
  vi.fn((url: string) => {
    const route = routes[url];
    return route ? route() : json({}, 404);
  }) as unknown as typeof fetch;

describe('loadGame', () => {
  it('loads the leaders and the puzzle of the day', async () => {
    const f = fakeFetch({ '/data/leaders.json': () => json(leadersFile), '/data/days/128.json': () => json(puzzle) });
    const r = await loadGame(128, initialState(), f);
    expect(r).toMatchObject({ ok: true, puzzle: { n: 128 } });
    if (r.ok) expect(r.leaders).toHaveLength(17);
  });

  it('requests the leaders and the puzzle at the same time', async () => {
    const requested: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const f = vi.fn(async (url: string) => {
      requested.push(url);
      if (url.endsWith('leaders.json')) await gate;
      return new Response(JSON.stringify(url.endsWith('leaders.json') ? leadersFile : puzzle));
    }) as unknown as typeof fetch;
    const pending = loadGame(128, initialState(), f);
    await Promise.resolve();
    expect(requested).toEqual(['/data/leaders.json', '/data/days/128.json']);
    release();
    expect((await pending).ok).toBe(true);
  });

  it('reports missing puzzles as a data error', async () => {
    const f = fakeFetch({ '/data/leaders.json': () => json(leadersFile) });
    expect(await loadGame(128, initialState(), f)).toEqual({ ok: false, kind: 'data' });
  });

  it('reports a puzzle that names an unknown leader as a data error', async () => {
    const bad = { ...puzzle, classic: { answer: 'nobody' } };
    const f = fakeFetch({ '/data/leaders.json': () => json(leadersFile), '/data/days/128.json': () => json(bad) });
    expect(await loadGame(128, initialState(), f)).toEqual({ ok: false, kind: 'data' });
  });

  it('reports invalid files as a data error', async () => {
    const f = fakeFetch({ '/data/leaders.json': () => json({ version: 1, leaders: [{ id: 'x' }] }), '/data/days/128.json': () => json(puzzle) });
    expect(await loadGame(128, initialState(), f)).toEqual({ ok: false, kind: 'data' });
  });

  it('reports network failures as offline', async () => {
    const f = fakeFetch({ '/data/leaders.json': () => Promise.reject(new TypeError('Failed to fetch')) });
    expect(await loadGame(128, initialState(), f)).toEqual({ ok: false, kind: 'offline' });
  });

  it('reuses the puzzle saved with a game already started today', async () => {
    const saved = reducer(initialState(), { type: 'start', puzzle });
    const f = fakeFetch({ '/data/leaders.json': () => json(leadersFile) });
    const r = await loadGame(128, saved, f);
    expect(r.ok).toBe(true);
    expect(f).toHaveBeenCalledTimes(1);
  });
});

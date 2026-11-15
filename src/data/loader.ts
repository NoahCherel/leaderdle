import type { Leader } from '../game/types';
import type { GameState } from '../store/state';
import { buildCells, type MayhemData, type Ratings } from '../game/mayhem';
import { DayPuzzleSchema, LeaderFileSchema, MayhemFileSchema, type DayPuzzle } from './schema';

export type LoadResult = { ok: true; leaders: Leader[]; puzzle: DayPuzzle } | { ok: false; kind: 'offline' | 'data' };

class DataError extends Error {}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

async function getJson(url: string, fetchImpl: typeof fetch): Promise<unknown> {
  const res = await fetchImpl(url);
  if (!res.ok) throw new DataError(`${url}: ${res.status}`);
  try {
    return await res.json();
  } catch {
    throw new DataError(`${url}: invalid JSON`);
  }
}

/**
 * Loads the leader list and today's puzzle. A game already started today
 * keeps its saved puzzle, so it stays playable if the network drops (PASSATION §12).
 */
export async function loadGame(n: number, saved: GameState, fetchImpl: typeof fetch = fetch): Promise<LoadResult> {
  try {
    // Both files are requested at once: one round trip instead of two before the first render.
    const savedPuzzle = saved.days[n]?.puzzle;
    const [leadersRaw, dayRaw] = await Promise.all([
      getJson(`${BASE}/data/leaders.json`, fetchImpl),
      savedPuzzle ? Promise.resolve(null) : getJson(`${BASE}/data/days/${n}.json`, fetchImpl),
    ]);
    const leadersParsed = LeaderFileSchema.safeParse(leadersRaw);
    if (!leadersParsed.success) return { ok: false, kind: 'data' };
    const leaders = leadersParsed.data.leaders as Leader[];

    let puzzle = savedPuzzle;
    if (!puzzle) {
      const parsed = DayPuzzleSchema.safeParse(dayRaw);
      if (!parsed.success || parsed.data.n !== n) return { ok: false, kind: 'data' };
      puzzle = parsed.data;
    }

    const ids = new Set(leaders.map((l) => l.id));
    const used = [puzzle.classic.answer, puzzle.letters.answer, puzzle.succession.before, puzzle.succession.answer, puzzle.succession.after, ...puzzle.timeline.order];
    if (!used.every((id) => ids.has(id))) return { ok: false, kind: 'data' };

    return { ok: true, leaders, puzzle };
  } catch (err) {
    if (err instanceof DataError) return { ok: false, kind: 'data' };
    return { ok: false, kind: 'offline' };
  }
}

export type MayhemResult = { ok: true; data: MayhemData } | { ok: false; kind: 'offline' | 'data' };

/**
 * Loads the Leader Mayhem ratings, only when the mode is opened. Ratings for leaders who are
 * not in the leader list are dropped, so the two files can be updated one after the other.
 */
export async function loadMayhem(leaders: Leader[], fetchImpl: typeof fetch = fetch): Promise<MayhemResult> {
  try {
    const parsed = MayhemFileSchema.safeParse(await getJson(`${BASE}/data/mayhem.json`, fetchImpl));
    if (!parsed.success) return { ok: false, kind: 'data' };
    const known = new Set(leaders.map((l) => l.id));
    const ratings: Ratings = Object.fromEntries(Object.entries(parsed.data.ratings).filter(([id]) => known.has(id)));
    return { ok: true, data: { leaders, ratings, cells: buildCells(leaders, ratings) } };
  } catch (err) {
    return { ok: false, kind: err instanceof DataError ? 'data' : 'offline' };
  }
}

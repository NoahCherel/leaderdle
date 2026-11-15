import type { Leader } from '../game/types';
import type { GameState } from '../store/state';
import { DayPuzzleSchema, LeaderFileSchema, type DayPuzzle } from './schema';

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
    const leadersRaw = await getJson(`${BASE}/data/leaders.json`, fetchImpl);
    const leadersParsed = LeaderFileSchema.safeParse(leadersRaw);
    if (!leadersParsed.success) return { ok: false, kind: 'data' };
    const leaders = leadersParsed.data.leaders as Leader[];

    let puzzle = saved.days[n]?.puzzle;
    if (!puzzle) {
      const parsed = DayPuzzleSchema.safeParse(await getJson(`${BASE}/data/days/${n}.json`, fetchImpl));
      if (!parsed.success || parsed.data.n !== n) return { ok: false, kind: 'data' };
      puzzle = parsed.data;
    }

    const ids = new Set(leaders.map((l) => l.id));
    const used = [puzzle.classic.answer, puzzle.succession.before, puzzle.succession.answer, puzzle.succession.after, ...puzzle.timeline.order];
    if (!used.every((id) => ids.has(id))) return { ok: false, kind: 'data' };

    return { ok: true, leaders, puzzle };
  } catch (err) {
    if (err instanceof DataError) return { ok: false, kind: 'data' };
    return { ok: false, kind: 'offline' };
  }
}

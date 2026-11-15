export interface ModeStats {
  played: number;
  wins: number;
  /** Current win streak. */
  cur: number;
  best: number;
  /** Guesses or checks used, for wins only. */
  dist: Record<number, number>;
  /** Puzzle number of the last recorded game, 0 if none. */
  last: number;
}

export interface Streak {
  n: number;
  last: number;
}

export const emptyStats = (): ModeStats => ({ played: 0, wins: 0, cur: 0, best: 0, dist: {}, last: 0 });

/** Adds a finished game. A win streak only continues from the previous day's puzzle. */
export function recordResult(stats: ModeStats, puzzle: number, won: boolean, used: number): ModeStats {
  if (stats.last === puzzle) return stats;
  const cur = won ? (stats.last === puzzle - 1 ? stats.cur : 0) + 1 : 0;
  return {
    played: stats.played + 1,
    wins: stats.wins + (won ? 1 : 0),
    cur,
    best: Math.max(stats.best, cur),
    dist: won ? { ...stats.dist, [used]: (stats.dist[used] ?? 0) + 1 } : stats.dist,
    last: puzzle,
  };
}

/** The header streak: consecutive days with Classic finished, won or lost (PASSATION §9). */
export function recordStreak(streak: Streak, puzzle: number): Streak {
  if (streak.last === puzzle) return streak;
  return { n: (streak.last === puzzle - 1 ? streak.n : 0) + 1, last: puzzle };
}

/** Win streak shown in the stats: still counts the day after the last game, 0 after a missed day. */
export function currentWinStreak(stats: ModeStats, puzzle: number): number {
  return stats.last === puzzle || stats.last === puzzle - 1 ? stats.cur : 0;
}

/** Still counts until the end of the next day, so today's game can extend it. */
export function currentStreak(streak: Streak, puzzle: number): number {
  return streak.last === puzzle || streak.last === puzzle - 1 ? streak.n : 0;
}

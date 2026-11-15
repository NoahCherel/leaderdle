const DAY = 86_400_000;
const two = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as `YYYY-MM-DD`. */
export const dayKey = (d: Date) => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;

/**
 * Puzzle number for the player's local date. Launch day is #1.
 * Counted on calendar dates (UTC arithmetic) so daylight saving cannot shift it.
 */
export function puzzleNumber(now: Date, launch: string): number {
  const [y, m, d] = launch.split('-').map(Number);
  const start = Date.UTC(y!, m! - 1, d!);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - start) / DAY) + 1;
}

/** Time left before the next local midnight, `HH:MM:SS`. */
export function countdown(now: Date): string {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const sec = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  return `${two(Math.floor(sec / 3600))}:${two(Math.floor(sec / 60) % 60)}:${two(sec % 60)}`;
}

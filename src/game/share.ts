import { MAX, MODE_NAMES, type Direction, type Mode, type TileState } from './types';

const SITE = 'leaderdle.com';
const E = { correct: '🟩', close: '🟨', blank: '⬜', up: '⬆️', down: '⬇️' } as const;

export interface Score {
  won: boolean;
  used: number;
}

export const score = (mode: Mode, s: Score) => `${s.won ? s.used : 'X'}/${MAX[mode]}`;
const title = (n: number, mode: Mode, s: Score) => `Leaderdle #${n} · ${MODE_NAMES[mode]} ${score(mode, s)}`;

/** One emoji per tile: green, yellow, an arrow for a numeric miss, white otherwise. */
export function classicEmoji(row: ReadonlyArray<{ state: TileState; dir: Direction }>): string {
  return row
    .map((t) => (t.state === 'correct' ? E.correct : t.state === 'close' ? E.close : t.dir === 'up' ? E.up : t.dir === 'down' ? E.down : E.blank))
    .join('');
}

/** Rows in the order they were played, oldest first. */
export function shareClassic(n: number, rows: ReadonlyArray<ReadonlyArray<{ state: TileState; dir: Direction }>>, s: Score, hint: boolean): string {
  return [title(n, 'classic', s) + (hint ? ' 💡' : ''), ...rows.map(classicEmoji), SITE].join('\n');
}

export function shareSuccession(n: number, guesses: readonly string[], answer: string, s: Score): string {
  return [title(n, 'succession', s), guesses.map((g) => (g === answer ? E.correct : E.blank)).join(''), SITE].join('\n');
}

export function shareTimeline(n: number, checks: ReadonlyArray<readonly number[]>, s: Score): string {
  return [title(n, 'timeline', s), ...checks.map((row) => row.map((v) => (v ? E.correct : E.blank)).join('')), SITE].join('\n');
}

export function dayLine(scores: Record<Mode, Score>): string {
  return (Object.keys(MODE_NAMES) as Mode[]).map((m) => `${MODE_NAMES[m]} ${score(m, scores[m])}`).join(' · ');
}

export function shareDay(n: number, scores: Record<Mode, Score>): string {
  return [`Leaderdle #${n}`, dayLine(scores), SITE].join('\n');
}

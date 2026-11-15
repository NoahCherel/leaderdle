import type { LetterState } from './letters';
import { OUTCOME_TEXT, PORTFOLIOS, PORTFOLIO_SHORT, type Outcome } from './mayhem';
import { MAX, MODE_NAMES, MODES, type Direction, type Mode, type TileState } from './types';

const SITE = 'leaderdle.com';
const E = { correct: '🟩', close: '🟧', blank: '⬜', up: '⬆️', down: '⬇️' } as const;

export interface Score {
  won: boolean;
  used: number;
}

export const score = (mode: Mode, s: Score) => `${s.won ? s.used : 'X'}/${MAX[mode]}`;
const title = (n: number, mode: Mode, s: Score) => `Leaderdle #${n} · ${MODE_NAMES[mode]} ${score(mode, s)}`;

/** One emoji per tile: green, orange, an arrow for a numeric miss, white otherwise. */
export function classicEmoji(row: ReadonlyArray<{ state: TileState; dir: Direction }>): string {
  return row
    .map((t) => (t.state === 'correct' ? E.correct : t.state === 'close' ? E.close : t.dir === 'up' ? E.up : t.dir === 'down' ? E.down : E.blank))
    .join('');
}

/** Rows in the order they were played, oldest first. */
export function shareClassic(n: number, rows: ReadonlyArray<ReadonlyArray<{ state: TileState; dir: Direction }>>, s: Score, hint: boolean): string {
  return [title(n, 'classic', s) + (hint ? ' 💡' : ''), ...rows.map(classicEmoji), SITE].join('\n');
}

const LETTER: Record<LetterState, string> = { correct: E.correct, present: E.close, absent: '⬛', gap: ' ' };

/** One row per guess, one square per letter, a space between words. */
export function shareLetters(n: number, rows: ReadonlyArray<readonly LetterState[]>, s: Score): string {
  return [title(n, 'letters', s), ...rows.map((row) => row.map((c) => LETTER[c]).join('')), SITE].join('\n');
}

export function shareSuccession(n: number, guesses: readonly string[], answer: string, s: Score): string {
  return [title(n, 'succession', s), guesses.map((g) => (g === answer ? E.correct : E.blank)).join(''), SITE].join('\n');
}

export function shareTimeline(n: number, checks: ReadonlyArray<readonly number[]>, s: Score): string {
  return [title(n, 'timeline', s), ...checks.map((row) => row.map((v) => (v ? E.correct : E.blank)).join('')), SITE].join('\n');
}

export function dayLine(scores: Record<Mode, Score>): string {
  return MODES.map((m) => `${MODE_NAMES[m]} ${score(m, scores[m])}`).join(' · ');
}

export function shareDay(n: number, scores: Record<Mode, Score>): string {
  return [`Leaderdle #${n}`, dayLine(scores), SITE].join('\n');
}

const MEDAL: Partial<Record<Outcome, string>> = { champion: '🏆 ', final: '🥈 ' };

/** The government as drafted: who held what, and the year. Ratings stay out of it. */
export function shareMayhem(outcome: Outcome, picks: ReadonlyArray<{ name: string; year: number }>): string {
  const lines = PORTFOLIOS.map((p, i) => PORTFOLIO_SHORT[p] + ': ' + picks[i]!.name + " ('" + String(picks[i]!.year).slice(-2) + ')');
  return ['Leaderdle · Leader Mayhem', (MEDAL[outcome] ?? '') + OUTCOME_TEXT[outcome], ...lines, SITE + '/mayhem'].join('\n');
}

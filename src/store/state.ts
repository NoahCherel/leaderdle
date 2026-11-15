import type { DayPuzzle } from '../data/schema';
import { emptyStats, recordResult, recordStreak, type ModeStats, type Streak } from '../game/stats';
import { fitsWord } from '../game/letters';
import { classicStatus, lettersStatus, successionStatus, timelineStatus } from '../game/status';
import { checkOrder } from '../game/timeline';
import { MAX, MODES, type Mode } from '../game/types';

export interface Settings {
  dark: boolean;
  cb: boolean;
  reduce: boolean;
}

/** Everything played on one puzzle day. Keeps its own copy of the puzzle so it stays playable offline. */
export interface DayRecord {
  puzzle: DayPuzzle;
  classic: string[];
  hint: boolean;
  /** Letters guesses, each shaped like the word (same length, same spaces). */
  letters: string[];
  succession: string[];
  order: string[];
  checks: number[][];
  /** Order at the last check, so the same order is never checked twice. */
  checked?: string[];
}

export interface GameState {
  v: 3;
  settings: Settings;
  consent: 'yes' | 'no' | null;
  helpSeen: Partial<Record<Mode, boolean>>;
  stats: Record<Mode, ModeStats>;
  streak: Streak;
  /** Keyed by puzzle number. */
  days: Record<number, DayRecord>;
}

export type Action =
  | { type: 'start'; puzzle: DayPuzzle }
  | { type: 'guess'; n: number; mode: 'classic' | 'succession'; id: string }
  | { type: 'letters'; n: number; guess: string }
  | { type: 'hint'; n: number }
  | { type: 'order'; n: number; order: string[] }
  | { type: 'check'; n: number }
  | { type: 'setting'; key: keyof Settings; value: boolean }
  | { type: 'consent'; value: 'yes' | 'no' }
  | { type: 'helpSeen'; mode: Mode }
  | { type: 'clear' }
  /** Another tab saved: take its state, keeping today's puzzle loaded. */
  | { type: 'replace'; state: GameState; puzzle: DayPuzzle };

/** Days kept in storage, today included. */
const KEEP_DAYS = 7;

const freshDay = (puzzle: DayPuzzle): DayRecord => ({ puzzle, classic: [], hint: false, letters: [], succession: [], order: [...puzzle.timeline.start], checks: [] });

const freshStats = ():Record<Mode, ModeStats> => ({ classic: emptyStats(), letters: emptyStats(), succession: emptyStats(), timeline: emptyStats() });

export const initialState = (): GameState => ({
  v: 3,
  settings: { dark: false, cb: false, reduce: false },
  consent: null,
  helpSeen: {},
  stats: freshStats(),
  streak: { n: 0, last: 0 },
  days: {},
});

export function dayStatus(day: DayRecord) {
  return {
    classic: classicStatus(day.classic, day.puzzle.classic.answer),
    letters: lettersStatus(day.letters, day.puzzle.letters.word),
    succession: successionStatus(day.succession, day.puzzle.succession.answer),
    timeline: timelineStatus(day.checks),
  };
}

/** Records stats for any game of this day that just ended. Idempotent. */
function settle(state: GameState, n: number): GameState {
  const day = state.days[n]!;
  const st = dayStatus(day);
  let { stats, streak } = state;
  for (const mode of MODES) {
    const s = st[mode];
    if (!s.done) continue;
    const next = recordResult(stats[mode], n, s.won, s.used);
    if (next !== stats[mode]) stats = { ...stats, [mode]: next };
    streak = recordStreak(streak, n);
  }
  return stats === state.stats && streak === state.streak ? state : { ...state, stats, streak };
}

const withDay = (state: GameState, n: number, patch: Partial<DayRecord>): GameState =>
  settle({ ...state, days: { ...state.days, [n]: { ...state.days[n]!, ...patch } } }, n);

const isPermutation = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && [...a].sort().join('\u0000') === [...b].sort().join('\u0000');

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'start': {
      const n = action.puzzle.n;
      const days: Record<number, DayRecord> = {};
      for (const [key, rec] of Object.entries(state.days)) {
        if (Number(key) > n - KEEP_DAYS) days[Number(key)] = rec;
      }
      if (!days[n]) days[n] = freshDay(action.puzzle);
      return { ...state, days };
    }
    case 'guess': {
      const day = state.days[action.n];
      if (!day) return state;
      const list = day[action.mode];
      if (dayStatus(day)[action.mode].done || list.includes(action.id)) return state;
      return withDay(state, action.n, { [action.mode]: [...list, action.id] });
    }
    case 'letters': {
      const day = state.days[action.n];
      if (!day || dayStatus(day).letters.done || !fitsWord(action.guess, day.puzzle.letters.word)) return state;
      return withDay(state, action.n, { letters: [...day.letters, action.guess] });
    }
    case 'hint': {
      const day = state.days[action.n];
      if (!day || day.hint) return state;
      return withDay(state, action.n, { hint: true });
    }
    case 'order': {
      const day = state.days[action.n];
      if (!day) return state;
      const st = dayStatus(day).timeline;
      if (st.done || !isPermutation(action.order, day.order)) return state;
      if (st.locked.some((v, i) => v && action.order[i] !== day.order[i])) return state;
      return withDay(state, action.n, { order: [...action.order] });
    }
    case 'check': {
      const day = state.days[action.n];
      if (!day || day.checks.length >= MAX.timeline || dayStatus(day).timeline.done) return state;
      if (day.checked?.join() === day.order.join()) return state;
      return withDay(state, action.n, { checks: [...day.checks, checkOrder(day.order, day.puzzle.timeline.order)], checked: [...day.order] });
    }
    case 'setting':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };
    case 'consent':
      return { ...state, consent: action.value };
    case 'helpSeen':
      return state.helpSeen[action.mode] ? state : { ...state, helpSeen: { ...state.helpSeen, [action.mode]: true } };
    case 'replace':
      return reducer(action.state, { type: 'start', puzzle: action.puzzle });
    case 'clear': {
      // Progress goes, puzzles stay loaded so the current day can be played again from scratch.
      const days: Record<number, DayRecord> = {};
      for (const [key, rec] of Object.entries(state.days)) days[Number(key)] = freshDay(rec.puzzle);
      return { ...initialState(), settings: state.settings, consent: state.consent, helpSeen: state.helpSeen, days };
    }
  }
}

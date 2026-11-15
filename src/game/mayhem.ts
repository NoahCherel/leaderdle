/**
 * Leader Mayhem: draft a government of five leaders, one per portfolio, from country-and-decade
 * draws, then send it through a three-round tournament. Ratings are hidden until the end.
 * Everything random comes from the run's seed, so a run can be replayed and tested.
 */
import { pickOne, rng, shuffle } from './rng.ts';
import type { Leader } from './types';

export const PORTFOLIOS = ['education', 'war', 'economy', 'domestic', 'foreign'] as const;
export type Portfolio = (typeof PORTFOLIOS)[number];
export const PORTFOLIO_NAMES: Record<Portfolio, string> = { education: 'Education', war: 'War', economy: 'Economy', domestic: 'Domestic', foreign: 'Foreign' };
export const PORTFOLIO_SHORT: Record<Portfolio, string> = { education: 'EDU', war: 'WAR', economy: 'ECO', domestic: 'DOM', foreign: 'FOR' };
export const ROUNDS = ['Quarter-final', 'Semi-final', 'Final'] as const;

/** Leader id → five ratings from 1 to 10, in PORTFOLIOS order. */
export type Ratings = Record<string, number[]>;

export interface Cell {
  country: string;
  decade: number;
  leaders: string[];
}

export interface MayhemData {
  leaders: Leader[];
  ratings: Ratings;
  cells: Cell[];
}

export interface Match {
  /** Five leader ids, in PORTFOLIOS order. */
  opponent: string[];
  /** One per portfolio: true when the player's leader won the duel. */
  duels: boolean[];
  won: boolean;
}

export interface MayhemRun {
  seed: number;
  /** Random events used so far: each one gets its own generator. */
  draws: number;
  cell: { country: string; decade: number } | null;
  team: Array<string | null>;
  years: Array<number | null>;
  /** True once spent. */
  rerolls: { country: boolean; decade: boolean };
  matches: Match[];
  done: boolean;
}

export type Outcome = 'quarter' | 'semi' | 'final' | 'champion';

const FIRST_DECADE = 1900;
/** How fast a rating gap turns into a win: 2 points ≈ 71 %, 4 points ≈ 86 %. */
const STEEPNESS = 0.45;
/** Where each round's opponent sits among sampled governments, weakest to strongest. */
const OPPONENT_RANK = [0.5, 0.72, 0.9];
const SAMPLES = 60;

const year = (iso: string) => Number(iso.slice(0, 4));
const decadeOf = (y: number) => Math.floor(y / 10) * 10;

/** Years in office as [from, to] pairs. Without terms, the first year and the total serve. */
function spans(l: Leader, today: Date): Array<[number, number]> {
  if (l.terms?.length) return l.terms.map((t) => [year(t.start), t.end ? year(t.end) : today.getFullYear()]);
  return [[l.tookOffice, l.tookOffice + l.yearsInOffice]];
}

/** Every country-and-decade with at least one rated leader in office. */
export function buildCells(leaders: readonly Leader[], ratings: Ratings, today = new Date()): Cell[] {
  const map = new Map<string, Cell>();
  for (const l of leaders) {
    if (!ratings[l.id]) continue;
    for (const [from, to] of spans(l, today)) {
      for (let d = Math.max(decadeOf(from), FIRST_DECADE); d <= to; d += 10) {
        const key = `${l.country}|${d}`;
        const cell = map.get(key) ?? { country: l.country, decade: d, leaders: [] };
        if (!cell.leaders.includes(l.id)) cell.leaders.push(l.id);
        map.set(key, cell);
      }
    }
  }
  return [...map.values()].sort((a, b) => a.decade - b.decade || a.country.localeCompare(b.country));
}

/** The year printed next to the name: when they took office, brought into the drawn decade. */
export function shownYear(l: Leader, decade: number, today = new Date()): number {
  const inDecade = spans(l, today).filter(([from, to]) => from <= decade + 9 && to >= decade);
  const from = Math.min(...(inDecade.length ? inDecade : spans(l, today)).map(([f]) => f));
  return Math.min(Math.max(from, decade), decade + 9);
}

const event = (run: MayhemRun) => rng((run.seed ^ Math.imul(run.draws + 1, 2654435761)) >>> 0);
const free = (cell: Cell, team: ReadonlyArray<string | null>) => cell.leaders.filter((id) => !team.includes(id));
const same = (a: { country: string; decade: number }, b: { country: string; decade: number }) => a.country === b.country && a.decade === b.decade;

/** Leaders offered by the current draw. */
export function offered(run: MayhemRun, data: MayhemData): string[] {
  const cell = run.cell && data.cells.find((c) => same(c, run.cell!));
  return cell ? free(cell, run.team) : [];
}

/**
 * Draws the decade first, then a country: recent decades have more countries to offer and
 * would otherwise come up all the time. A draw always leaves a choice of two when it can.
 */
function spin(data: MayhemData, team: ReadonlyArray<string | null>, rand: () => number): Cell | null {
  for (const min of [2, 1]) {
    const open = data.cells.filter((c) => free(c, team).length >= min);
    if (!open.length) continue;
    const decade = pickOne([...new Set(open.map((c) => c.decade))], rand);
    return pickOne(open.filter((c) => c.decade === decade), rand);
  }
  return null;
}

export function newRun(seed: number, data: MayhemData): MayhemRun {
  const run: MayhemRun = { seed, draws: 0, cell: null, team: [null, null, null, null, null], years: [null, null, null, null, null], rerolls: { country: false, decade: false }, matches: [], done: false };
  const cell = spin(data, run.team, event(run));
  return { ...run, draws: 1, cell: cell && { country: cell.country, decade: cell.decade } };
}

/** Puts an offered leader on a free portfolio, then draws the next round. */
export function pick(run: MayhemRun, id: string, slot: number, data: MayhemData): MayhemRun {
  if (!run.cell || run.team[slot] !== null || slot < 0 || slot >= PORTFOLIOS.length || !offered(run, data).includes(id)) return run;
  const leader = data.leaders.find((l) => l.id === id);
  if (!leader) return run;
  const team = run.team.map((t, i) => (i === slot ? id : t));
  const years = run.years.map((y, i) => (i === slot ? shownYear(leader, run.cell!.decade) : y));
  const next = team.includes(null) ? spin(data, team, event(run)) : null;
  return { ...run, team, years, draws: run.draws + 1, cell: next && { country: next.country, decade: next.decade } };
}

/** Where a reroll could land: another country in the same decade, or another decade of the same country. */
export function rerollTargets(run: MayhemRun, kind: 'country' | 'decade', data: MayhemData): Cell[] {
  const now = run.cell;
  if (!now || run.rerolls[kind]) return [];
  return data.cells.filter(
    (c) => !same(c, now) && (kind === 'country' ? c.decade === now.decade : c.country === now.country) && free(c, run.team).length >= 2,
  );
}

export function reroll(run: MayhemRun, kind: 'country' | 'decade', data: MayhemData): MayhemRun {
  const targets = rerollTargets(run, kind, data);
  if (!targets.length) return run;
  const cell = pickOne(targets, event(run));
  return { ...run, draws: run.draws + 1, rerolls: { ...run.rerolls, [kind]: true }, cell: { country: cell.country, decade: cell.decade } };
}

export const duelChance = (mine: number, theirs: number) => 1 / (1 + Math.exp(-STEEPNESS * (mine - theirs)));

/** Five duels, portfolio against portfolio. Three wins take the match. */
export function playMatch(mine: readonly number[], theirs: readonly number[], rand: () => number): { duels: boolean[]; won: boolean } {
  const duels = PORTFOLIOS.map((_, i) => rand() < duelChance(mine[i]!, theirs[i]!));
  return { duels, won: duels.filter(Boolean).length >= 3 };
}

export const teamTotal = (team: readonly string[], ratings: Ratings) => team.reduce((sum, id, i) => sum + (ratings[id]?.[i] ?? 0), 0);
const onPortfolio = (team: readonly string[], ratings: Ratings) => team.map((id, i) => ratings[id]?.[i] ?? 0);

/** A rival government for the round: sampled at random, then taken at that round's strength. */
export function opponent(data: MayhemData, team: ReadonlyArray<string | null>, round: number, rand: () => number): string[] {
  const pool = Object.keys(data.ratings).filter((id) => !team.includes(id));
  const samples = Array.from({ length: SAMPLES }, () => shuffle(pool, rand).slice(0, PORTFOLIOS.length));
  samples.sort((a, b) => teamTotal(a, data.ratings) - teamTotal(b, data.ratings));
  return samples[Math.min(SAMPLES - 1, Math.floor(OPPONENT_RANK[round]! * SAMPLES))]!;
}

/** Plays the next round. The run ends at the first defeat, or after the final. */
export function playNext(run: MayhemRun, data: MayhemData): MayhemRun {
  if (run.done || run.team.includes(null) || run.matches.length >= ROUNDS.length) return run;
  const team = run.team as string[];
  const rand = event(run);
  const opp = opponent(data, team, run.matches.length, rand);
  const result = playMatch(onPortfolio(team, data.ratings), onPortfolio(opp, data.ratings), rand);
  const matches = [...run.matches, { opponent: opp, ...result }];
  return { ...run, draws: run.draws + 1, matches, done: !result.won || matches.length === ROUNDS.length };
}

export function runOutcome(run: MayhemRun): Outcome {
  const wins = run.matches.filter((m) => m.won).length;
  return wins >= 3 ? 'champion' : wins === 2 ? 'final' : wins === 1 ? 'semi' : 'quarter';
}

export const OUTCOME_TEXT: Record<Outcome, string> = {
  quarter: 'Out in the quarter-final',
  semi: 'Out in the semi-final',
  final: 'Runner-up',
  champion: 'Champion',
};

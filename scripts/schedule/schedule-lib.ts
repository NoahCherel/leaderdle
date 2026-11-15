// Puzzle calendar (PASSATION §13.2): one puzzle per mode per day, numbered from 1, a different
// answer in each mode, only well-known leaders as answers. Append-only: published days never change.
import type { DayPuzzle } from '../../src/data/schema.ts';
import type { Leader } from '../../src/game/types.ts';
import type { OfficeOut } from '../leaders/build-lib.ts';

export interface ScheduleOptions {
  seed: number;
  /** Days before a Classic answer can come back. */
  classicGap: number;
  /** Days before a Letters answer can come back. */
  lettersGap: number;
  /** Days before a Succession answer can come back. */
  successionGap: number;
  /** Days before a Timeline card can come back. */
  timelineGap: number;
  /** Days during which a Classic, Letters or Succession answer is not used as another mode's answer. */
  crossGap: number;
}

export interface Forced {
  classic?: string;
  /** Letters answer; it needs a word in data/letters.json. */
  letters?: string;
  /** Succession answer; the matching candidate is used. */
  succession?: string;
  /** Five leader ids for Timeline, in any order. */
  timeline?: string[];
}

type Succession = DayPuzzle['succession'];

const DAY = 86_400_000;
const t = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const span = (start: string, end: string | null) => `${start.slice(0, 4)} – ${end ? end.slice(0, 4) : 'present'}`;

/** Small seeded PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: readonly T[], rand: () => number): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Every "before → answer → after" triple available: consecutive holders of one office,
 * with an answerable middle leader, both neighbours in the guess list, and no overlapping terms
 * (which would mean a collective or shared office). A month of slack allows for handovers.
 */
export function successionCandidates(leaders: Leader[], offices: Record<string, OfficeOut>): Succession[] {
  const byId = new Map(leaders.map((l) => [l.id, l]));
  const out: Succession[] = [];
  const seen = new Set<string>();
  for (const office of Object.values(offices)) {
    const h = office.holders;
    for (let i = 1; i < h.length - 1; i++) {
      const [b, m, a] = [h[i - 1]!, h[i]!, h[i + 1]!];
      if (!byId.get(m.id)?.answerable || !byId.has(b.id) || !byId.has(a.id)) continue;
      if (new Set([b.id, m.id, a.id]).size < 3) continue;
      if (!b.end || !m.end) continue;
      if (t(b.end) > t(m.start) + 31 * DAY || t(m.end) > t(a.start) + 31 * DAY) continue;
      // No gap either: a gap means someone else (often an interim government) governed in between.
      if (t(m.start) - t(b.end) > 31 * DAY || t(a.start) - t(m.end) > 31 * DAY) continue;
      // Nobody else may hold the office during the chain (rival, exiled or collective holders).
      const from = t(b.end) - 31 * DAY;
      const to = t(a.start) + 31 * DAY;
      const rival = h.some((x, k) => k !== i - 1 && k !== i && k !== i + 1 && t(x.start) < to && (x.end ? t(x.end) : Infinity) > from);
      if (rival) continue;
      // The office must belong to the answer's country (not a realm sharing the same monarch).
      if (byId.get(m.id)!.country !== office.countryName) continue;
      const key = `${b.id}>${m.id}>${a.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ before: b.id, answer: m.id, after: a.id, years: span(m.start, m.end), beforeYears: span(b.start, b.end), afterYears: span(a.start, a.end) });
    }
  }
  return out;
}

function pickTimeline(pool: Leader[], rand: () => number): Leader[] | null {
  for (let attempt = 0; attempt < 40; attempt++) {
    const picked: Leader[] = [];
    for (const l of shuffle(pool, rand)) {
      if (picked.every((p) => Math.abs(p.tookOffice - l.tookOffice) >= 3)) picked.push(l);
      if (picked.length === 5) break;
    }
    if (picked.length === 5 && new Set(picked.map((p) => p.country)).size >= 3) return picked;
  }
  return null;
}

/** A start order with no card already in its place. */
function derange(order: string[], rand: () => number): string[] {
  for (;;) {
    const s = shuffle(order, rand);
    if (s.every((id, i) => id !== order[i])) return s;
  }
}

export function extendSchedule(
  existing: DayPuzzle[],
  upTo: number,
  leaders: Leader[],
  offices: Record<string, OfficeOut>,
  /** Leader id → the name to spell in Letters. */
  words: Record<string, string>,
  forced: Record<number, Forced>,
  opts: ScheduleOptions,
): DayPuzzle[] {
  const days = existing.slice().sort((a, b) => a.n - b.n);
  const answerable = leaders.filter((l) => l.answerable);
  const byId = new Map(leaders.map((l) => [l.id, l]));
  const successions = successionCandidates(leaders, offices);

  const recent = (n: number, gap: number, pick: (d: DayPuzzle) => string[]) =>
    new Set(days.filter((d) => d.n < n && d.n >= n - gap).flatMap(pick));

  for (let n = (days[days.length - 1]?.n ?? 0) + 1; n <= upTo; n++) {
    const rand = rng(opts.seed ^ Math.imul(n, 2654435761));
    const f = forced[n] ?? {};
    const fail = (what: string) => new Error(`day ${n}: not enough leaders for ${what}. Lower the gaps or add answerable leaders.`);

    // Classic.
    const usedClassic = recent(n, opts.classicGap, (d) => [d.classic.answer]);
    const usedCross = recent(n, opts.crossGap, (d) => [d.classic.answer, d.letters.answer, d.succession.answer]);
    const classic = f.classic ?? shuffle(answerable, rand).find((l) => !usedClassic.has(l.id) && !usedCross.has(l.id))?.id;
    if (!classic || !byId.has(classic)) throw fail('Classic');

    // Succession: the Classic answer must not appear anywhere in it.
    const usedSuc = recent(n, opts.successionGap, (d) => [d.succession.answer]);
    const sucPool = f.succession
      ? successions.filter((s) => s.answer === f.succession)
      : shuffle(successions, rand).filter((s) => !usedSuc.has(s.answer) && !usedCross.has(s.answer));
    const succession = sucPool.find((s) => ![s.before, s.answer, s.after].includes(classic));
    if (!succession) throw fail('Succession');

    // Letters: a leader with a word to spell, not one of today's other leaders.
    const usedLet = recent(n, opts.lettersGap, (d) => [d.letters.answer]);
    const taken = [classic, succession.before, succession.answer, succession.after];
    const letters = f.letters ?? shuffle(answerable, rand).find((l) => words[l.id] && !usedLet.has(l.id) && !usedCross.has(l.id) && !taken.includes(l.id))?.id;
    if (!letters || !words[letters]) throw fail('Letters');

    // Timeline: five cards, none of today's other leaders.
    const today = new Set([...taken, letters]);
    const usedTim = recent(n, opts.timelineGap, (d) => d.timeline.order);
    const cards = f.timeline
      ? f.timeline.map((id) => byId.get(id)!)
      : pickTimeline(answerable.filter((l) => !today.has(l.id) && !usedTim.has(l.id)), rand);
    if (!cards || cards.length !== 5 || cards.some((c) => !c)) throw fail('Timeline');
    const order = cards.slice().sort((a, b) => a.tookOffice - b.tookOffice).map((l) => l.id);

    days.push({ n, classic: { answer: classic }, letters: { answer: letters, word: words[letters]! }, succession, timeline: { order, start: derange(order, rand) } });
  }
  return days;
}

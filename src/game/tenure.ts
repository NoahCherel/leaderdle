import type { Leader, Term } from './types';

const parse = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
};

const DAY = 86_400_000;

/** Whole calendar years between two dates (anniversary based). */
const wholeYears = (from: Date, to: Date): number => {
  let years = to.getFullYear() - from.getFullYear();
  if (to.getMonth() < from.getMonth() || (to.getMonth() === from.getMonth() && to.getDate() < from.getDate())) years -= 1;
  return Math.max(0, years);
};

/** Merges overlapping terms into disjoint [start, end] intervals. */
const merge = (terms: Term[], today: Date): Array<[Date, Date]> => {
  const spans = terms
    .map((t): [Date, Date] => [parse(t.start), t.end ? parse(t.end) : today])
    .sort((a, b) => a[0].getTime() - b[0].getTime());
  const out: Array<[Date, Date]> = [];
  for (const s of spans) {
    const last = out[out.length - 1];
    if (last && s[0] <= last[1]) {
      if (s[1] > last[1]) last[1] = s[1];
    } else out.push([s[0], s[1]]);
  }
  return out;
};

/**
 * Total time in office, rounded down to whole years (PASSATION §5).
 * Leaders still in office count up to `today`.
 */
export function yearsInOffice(leader: Leader, today: Date): number {
  if (!leader.terms?.length) return leader.yearsInOffice;
  const spans = merge(leader.terms, today);
  if (spans.length === 1) return wholeYears(spans[0]![0], spans[0]![1]);
  const days = spans.reduce((sum, [a, b]) => sum + (b.getTime() - a.getTime()) / DAY, 0);
  return Math.floor((days + 0.5) / 365.2425);
}

export function isInOffice(leader: Leader): boolean {
  return !!leader.terms?.some((t) => t.end === null);
}

/** Term shown under a name in suggestions and on cards. */
export function termSpan(leader: Leader): string {
  if (!leader.terms?.length) {
    return `from ${leader.tookOffice}, ${leader.yearsInOffice} ${leader.yearsInOffice === 1 ? 'year' : 'years'} in office`;
  }
  const first = Math.min(...leader.terms.map((t) => parse(t.start).getFullYear()));
  if (isInOffice(leader)) return `${first} – present`;
  const last = Math.max(...leader.terms.map((t) => parse(t.end!).getFullYear()));
  return `${first} – ${last}`;
}

import { extendSchedule, successionCandidates, type ScheduleOptions } from './schedule-lib.ts';
import type { OfficeOut } from '../leaders/build-lib.ts';
import type { Leader } from '../../src/game/types.ts';

const COUNTRIES = ['Alpha', 'Beta', 'Gamma', 'Delta'];

const leader = (i: number, answerable = true): Leader => ({
  id: `Q${i}`, name: `Leader ${i}`, aliases: [], country: COUNTRIES[i % 4]!, countryCode: 'AAA', iso2: null, continent: 'Europe',
  role: 'gov', tookOffice: 1900 + i, yearsInOffice: 1, ageAtStart: 50, answerable,
});

// 120 leaders, one office per country with a long chain of holders.
const LEADERS = Array.from({ length: 120 }, (_, i) => leader(i, i % 10 !== 9));
const OFFICES: Record<string, OfficeOut> = Object.fromEntries(
  COUNTRIES.map((c, k) => [
    `O${k}`,
    {
      label: `Prime Minister of ${c}`, country: c, kind: 'gov' as const,
      holders: LEADERS.filter((_, i) => i % 4 === k).map((l) => ({ id: l.id, start: `${l.tookOffice}-01-01`, end: `${l.tookOffice + 4}-01-01` })),
    },
  ]),
);
const OPTS: ScheduleOptions = { seed: 7, classicGap: 60, successionGap: 40, timelineGap: 5, crossGap: 10 };
const make = (upTo: number, existing = [], forced = {}) => extendSchedule(existing, upTo, LEADERS, OFFICES, forced, OPTS);
const byId = new Map(LEADERS.map((l) => [l.id, l]));

describe('successionCandidates', () => {
  it('uses consecutive holders of one office, the middle one answerable', () => {
    const c = successionCandidates(LEADERS, OFFICES);
    expect(c.length).toBeGreaterThan(50);
    for (const s of c) {
      expect(byId.get(s.answer)!.answerable).toBe(true);
      expect(new Set([s.before, s.answer, s.after]).size).toBe(3);
    }
    expect(c.find((s) => s.answer === 'Q4')).toEqual({ before: 'Q0', answer: 'Q4', after: 'Q8', years: '1904 – 1908', beforeYears: '1900 – 1904', afterYears: '1908 – 1912' });
  });

  it('skips overlapping terms (collective or co-held offices)', () => {
    const offices = { X: { label: 'Council', country: 'Alpha', kind: 'gov' as const, holders: [
      { id: 'Q0', start: '1900-01-01', end: '1910-01-01' }, { id: 'Q4', start: '1902-01-01', end: '1906-01-01' }, { id: 'Q8', start: '1906-01-01', end: '1912-01-01' },
    ] } };
    expect(successionCandidates(LEADERS, offices)).toEqual([]);
  });

  it('shows "present" for a successor still in office', () => {
    const offices = { X: { label: 'PM', country: 'Alpha', kind: 'gov' as const, holders: [
      { id: 'Q0', start: '1900-01-01', end: '1904-01-01' }, { id: 'Q4', start: '1904-01-01', end: '1908-01-01' }, { id: 'Q8', start: '1908-01-01', end: null },
    ] } };
    expect(successionCandidates(LEADERS, offices)[0]!.afterYears).toBe('1908 – present');
  });
});

describe('extendSchedule', () => {
  const days = make(200);

  it('numbers days from 1 and is deterministic', () => {
    expect(days.map((d) => d.n)).toEqual(Array.from({ length: 200 }, (_, i) => i + 1));
    expect(make(200)).toEqual(days);
  });

  it('never changes days already published', () => {
    const first = make(50);
    const tampered = first.map((d) => (d.n === 10 ? { ...d, classic: { answer: 'Q0' } } : d));
    const longer = make(80, tampered as never);
    expect(longer.slice(0, 50)).toEqual(tampered);
    expect(longer).toHaveLength(80);
  });

  it('only uses answerable leaders as answers, and different answers in each mode', () => {
    for (const d of days) {
      const answers = [d.classic.answer, d.succession.answer, ...d.timeline.order];
      for (const id of answers) expect(byId.get(id)!.answerable).toBe(true);
      expect(new Set(answers).size).toBe(7);
    }
  });

  it('does not repeat a Classic answer within the gap', () => {
    days.forEach((d, i) => {
      const recent = days.slice(Math.max(0, i - OPTS.classicGap), i).map((x) => x.classic.answer);
      expect(recent).not.toContain(d.classic.answer);
    });
  });

  it('Timeline: five distinct years in order, at least three countries, nothing in place at the start', () => {
    for (const d of days) {
      const years = d.timeline.order.map((id) => byId.get(id)!.tookOffice);
      expect([...years].sort((a, b) => a - b)).toEqual(years);
      expect(new Set(years).size).toBe(5);
      expect(new Set(d.timeline.order.map((id) => byId.get(id)!.country)).size).toBeGreaterThanOrEqual(3);
      expect([...d.timeline.start].sort()).toEqual([...d.timeline.order].sort());
      d.timeline.start.forEach((id, i) => expect(id).not.toBe(d.timeline.order[i]));
    }
  });

  it('Succession puzzles come from the candidate list', () => {
    const keys = new Set(successionCandidates(LEADERS, OFFICES).map((c) => `${c.before}>${c.answer}>${c.after}`));
    for (const d of days) expect(keys.has(`${d.succession.before}>${d.succession.answer}>${d.succession.after}`)).toBe(true);
  });

  it('applies forced picks', () => {
    const forced = { 3: { classic: 'Q42' } };
    expect(make(5, [], forced)[2]!.classic.answer).toBe('Q42');
  });

  it('fails clearly when the pool is too small', () => {
    expect(() => extendSchedule([], 30, LEADERS.slice(0, 12), OFFICES, {}, OPTS)).toThrow(/day 1|not enough/i);
  });
});

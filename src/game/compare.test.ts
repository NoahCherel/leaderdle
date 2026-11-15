import { compare } from './compare';
import { byId } from './fixtures';

const today = new Date(2026, 10, 15);
const answer = byId('mer');
const pick = (id: string) => compare(byId(id), answer, today);
const states = (id: string) => pick(id).map((t) => [t.state, t.dir]);

describe('compare (capture 02-progress, answer Angela Merkel)', () => {
  it('Nelson Mandela: Both is close, numbers point toward the answer', () => {
    expect(states('man')).toEqual([
      ['miss', null], ['close', null], ['miss', 'up'], ['miss', 'up'], ['miss', 'down'],
    ]);
  });

  it('Margaret Thatcher: same continent and age within 5 are close', () => {
    expect(states('tha')).toEqual([
      ['close', null], ['correct', null], ['miss', 'up'], ['miss', 'up'], ['close', 'down'],
    ]);
  });

  it('Lee Kuan Yew', () => {
    expect(states('lky')).toEqual([
      ['miss', null], ['correct', null], ['miss', 'up'], ['miss', 'down'], ['miss', 'up'],
    ]);
  });

  it('the answer itself is all correct with no arrows', () => {
    expect(states('mer')).toEqual(Array(5).fill(['correct', null]));
  });

  it('uses the exact thresholds 10, 2 and 5', () => {
    const a = { ...answer, tookOffice: 2000, yearsInOffice: 10, ageAtStart: 50 };
    const g = (took: number, years: number, age: number) =>
      compare({ ...byId('koh'), tookOffice: took, yearsInOffice: years, ageAtStart: age }, a, today).slice(2).map((t) => t.state);
    expect(g(1990, 8, 45)).toEqual(['close', 'close', 'close']);
    expect(g(1989, 7, 44)).toEqual(['miss', 'miss', 'miss']);
  });

  it('two Both leaders share the same role', () => {
    expect(compare(byId('oba'), byId('man'), today)[1]!.state).toBe('correct');
  });

  it('head of state against head of government is a miss', () => {
    expect(compare(byId('eli'), answer, today)[1]!.state).toBe('miss');
  });
});

describe('tile text', () => {
  it('has full and short values', () => {
    const [country, role, took] = pick('tha');
    expect([country!.value, country!.short]).toEqual(['United Kingdom', 'GBR']);
    expect([role!.value, role!.short]).toEqual(['Head of government', 'Gov']);
    expect([took!.value, took!.short]).toEqual(['1979', '1979']);
  });

  it('has full screen reader labels', () => {
    const t = pick('tha');
    expect(t[2]!.aria).toBe('Took office: 1979, target is later');
    expect(t[4]!.aria).toBe('Age at start: 53, close, target is younger');
    expect(t[1]!.aria).toBe('Role: Head of government, correct');
    expect(t[0]!.aria).toBe('Country: United Kingdom, close');
    expect(pick('lky')[0]!.aria).toBe('Country: Singapore, no match');
    expect(pick('mer')[3]!.aria).toBe('Years in office: 16, correct');
  });

  it('flags a leader still in office on the Years in office tile', () => {
    const current = { ...byId('ard'), terms: [{ start: '2020-11-15', end: null }] };
    const t = compare(current, answer, today)[3]!;
    expect(t.inOffice).toBe(true);
    expect(t.value).toBe('6');
    expect(t.aria).toBe('Years in office: 6, still in office, target is more');
  });
});

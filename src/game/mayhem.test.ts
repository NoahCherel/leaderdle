import { describe, expect, it } from 'vitest';
import {
  PORTFOLIOS,
  buildCells,
  duelChance,
  newRun,
  opponent,
  pick,
  playMatch,
  playNext,
  reroll,
  runOutcome,
  shownYear,
  teamTotal,
  type MayhemData,
  type MayhemRun,
} from './mayhem';
import { rng } from './rng';
import type { Leader } from './types';

const leader = (id: string, country: string, start: number, end: number | null, withTerms = true): Leader => ({
  id, name: `Leader ${id}`, aliases: [], country, countryCode: 'AAA', iso2: null, continent: 'Europe', role: 'gov',
  tookOffice: start, yearsInOffice: (end ?? 2026) - start, ageAtStart: 50,
  terms: withTerms ? [{ start: `${start}-05-01`, end: end ? `${end}-05-01` : null }] : undefined,
});

// Alpha has three leaders in the 1980s, Beta two in the 1980s and two in the 1990s, Gamma one alone.
const LEADERS: Leader[] = [
  leader('a1', 'Alpha', 1979, 1990),
  leader('a2', 'Alpha', 1981, 1984),
  leader('a3', 'Alpha', 1984, 1995),
  leader('a4', 'Alpha', 1995, 2003),
  leader('b1', 'Beta', 1982, 1989),
  leader('b2', 'Beta', 1989, 1996),
  leader('b3', 'Beta', 1996, 2004),
  leader('g1', 'Gamma', 1960, 1965),
  leader('d1', 'Delta', 1961, 1968, false),
  leader('d2', 'Delta', 1968, 1975, false),
  leader('x1', 'Unrated', 1980, 1989),
  leader('x2', 'Unrated', 1981, 1988),
];
const RATINGS: MayhemData['ratings'] = {
  a1: [3, 9, 8, 7, 8], a2: [5, 2, 4, 5, 3], a3: [6, 4, 7, 6, 5], a4: [4, 3, 6, 5, 6],
  b1: [8, 2, 5, 6, 4], b2: [5, 5, 5, 5, 5], b3: [2, 6, 3, 4, 7],
  g1: [7, 7, 7, 7, 7], d1: [4, 4, 4, 4, 4], d2: [6, 6, 6, 6, 6],
};
const DATA: MayhemData = { leaders: LEADERS, ratings: RATINGS, cells: buildCells(LEADERS, RATINGS) };
const cell = (country: string, decade: number) => DATA.cells.find((c) => c.country === country && c.decade === decade);

describe('buildCells', () => {
  it('groups rated leaders by country and by each decade they were in office', () => {
    expect(cell('Alpha', 1980)!.leaders.sort()).toEqual(['a1', 'a2', 'a3']);
    expect(cell('Alpha', 1970)!.leaders).toEqual(['a1']);
    expect(cell('Alpha', 1990)!.leaders.sort()).toEqual(['a1', 'a3', 'a4']);
    expect(cell('Beta', 1990)!.leaders.sort()).toEqual(['b2', 'b3']);
  });
  it('leaves out leaders without ratings', () => {
    expect(cell('Unrated', 1980)).toBeUndefined();
  });
  it('falls back on the first year and the years in office when a leader has no terms', () => {
    expect(cell('Delta', 1960)!.leaders.sort()).toEqual(['d1', 'd2']);
    expect(cell('Delta', 1970)!.leaders).toEqual(['d2']);
  });
  it('counts a leader still in office up to the current decade', () => {
    const cells = buildCells([leader('n', 'Now', 2019, null)], { n: [5, 5, 5, 5, 5] }, new Date(2026, 0, 1));
    expect(cells.map((c) => c.decade)).toEqual([2010, 2020]);
  });
});

describe('shownYear', () => {
  it('is the year the leader took office when it falls in the decade', () => {
    expect(shownYear(LEADERS[1]!, 1980)).toBe(1981);
  });
  it('is brought into the decade when the leader took office before it', () => {
    expect(shownYear(LEADERS[0]!, 1970)).toBe(1979);
    expect(shownYear(LEADERS[0]!, 1980)).toBe(1980);
    expect(shownYear(LEADERS[0]!, 1990)).toBe(1990);
  });
});

describe('newRun', () => {
  it('draws a country and decade with at least two leaders to choose from', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const run = newRun(seed, DATA);
      expect(cell(run.cell!.country, run.cell!.decade)!.leaders.length).toBeGreaterThanOrEqual(2);
    }
  });
  it('is the same run for the same seed', () => {
    expect(newRun(7, DATA)).toEqual(newRun(7, DATA));
  });
  it('does not always start in the same place', () => {
    const starts = new Set(Array.from({ length: 40 }, (_, i) => JSON.stringify(newRun(i + 1, DATA).cell)));
    expect(starts.size).toBeGreaterThan(2);
  });
});

/** Picks the first offered leader for the first free portfolio until the team is full. */
function fill(run: MayhemRun): MayhemRun {
  while (run.team.includes(null)) {
    const offered = cell(run.cell!.country, run.cell!.decade)!.leaders.filter((id) => !run.team.includes(id));
    if (!offered.length) throw new Error('the draw offers nobody new');
    run = pick(run, offered[0]!, run.team.indexOf(null), DATA);
  }
  return run;
}

describe('pick', () => {
  const start = newRun(3, DATA);
  const offered = cell(start.cell!.country, start.cell!.decade)!.leaders;

  it('puts the leader on the portfolio, with the year shown, and draws the next round', () => {
    const run = pick(start, offered[0]!, 2, DATA);
    expect(run.team).toEqual([null, null, offered[0], null, null]);
    expect(run.years[2]).toBe(shownYear(LEADERS.find((l) => l.id === offered[0])!, start.cell!.decade));
    expect(run.cell).not.toBeNull();
  });
  it('refuses a leader who is not in the draw, a taken portfolio, or a leader already on the team', () => {
    expect(pick(start, 'g1', 0, DATA)).toBe(start);
    const one = pick(start, offered[0]!, 2, DATA);
    const next = cell(one.cell!.country, one.cell!.decade)!.leaders.find((id) => id !== offered[0])!;
    expect(pick(one, next, 2, DATA)).toBe(one);
    expect(pick(one, offered[0]!, 0, DATA)).toBe(one);
  });
  it('never offers a draw where only leaders already on the team are left', () => {
    for (let seed = 1; seed <= 60; seed++) {
      let run = newRun(seed, DATA);
      while (run.team.includes(null)) {
        const free = cell(run.cell!.country, run.cell!.decade)!.leaders.filter((id) => !run.team.includes(id));
        expect(free.length).toBeGreaterThanOrEqual(1);
        run = pick(run, free[0]!, run.team.indexOf(null), DATA);
      }
    }
  });
  it('stops drawing once the five portfolios are filled', () => {
    const run = fill(newRun(5, DATA));
    expect(run.team.filter(Boolean)).toHaveLength(5);
    expect(new Set(run.team).size).toBe(5);
    expect(run.cell).toBeNull();
  });
});

describe('reroll', () => {
  it('changes the country and keeps the decade, once per run', () => {
    const start = { ...newRun(1, DATA), cell: { country: 'Alpha', decade: 1980 } };
    const run = reroll(start, 'country', DATA);
    expect(run.cell).toEqual({ country: 'Beta', decade: 1980 });
    expect(run.rerolls.country).toBe(true);
    expect(reroll(run, 'country', DATA)).toBe(run);
  });
  it('changes the decade and keeps the country, once per run', () => {
    const start = { ...newRun(1, DATA), cell: { country: 'Beta', decade: 1980 } };
    const run = reroll(start, 'decade', DATA);
    expect(run.cell).toEqual({ country: 'Beta', decade: 1990 });
    expect(reroll(run, 'decade', DATA)).toBe(run);
  });
  it('does nothing, and is not spent, when there is nowhere else to go', () => {
    const start = { ...newRun(1, DATA), cell: { country: 'Delta', decade: 1960 } };
    expect(reroll(start, 'decade', DATA)).toBe(start);
    expect(reroll(start, 'country', DATA)).toBe(start);
  });
});

describe('duelChance', () => {
  it('is even for equal ratings and grows with the gap', () => {
    expect(duelChance(6, 6)).toBe(0.5);
    expect(duelChance(8, 6)).toBeGreaterThan(0.65);
    expect(duelChance(10, 1)).toBeGreaterThan(0.95);
    expect(duelChance(6, 8)).toBeCloseTo(1 - duelChance(8, 6));
  });
});

describe('playMatch', () => {
  it('plays five duels and is won with three', () => {
    const m = playMatch([10, 10, 10, 1, 1], [1, 1, 1, 10, 10], () => 0.5);
    expect(m.duels).toEqual([true, true, true, false, false]);
    expect(m.won).toBe(true);
    expect(playMatch([1, 1, 1, 10, 10], [10, 10, 10, 1, 1], () => 0.5).won).toBe(false);
  });
  it('lets the weaker side win a duel now and then', () => {
    const rand = rng(11);
    const wins = Array.from({ length: 2000 }, () => playMatch([5, 5, 5, 5, 5], [7, 7, 7, 7, 7], rand).duels.filter(Boolean).length).reduce((a, b) => a + b, 0);
    expect(wins / 10000).toBeGreaterThan(0.2);
    expect(wins / 10000).toBeLessThan(0.4);
  });
});

describe('opponent', () => {
  it('is five different rated leaders, none from the player’s team', () => {
    const team = ['a1', 'a2', 'a3', 'b1', 'b2'];
    const opp = opponent(DATA, team, 0, rng(4));
    expect(new Set(opp).size).toBe(5);
    for (const id of opp) {
      expect(RATINGS[id]).toBeDefined();
      expect(team).not.toContain(id);
    }
  });
  it('places its five leaders on the portfolios that give it the best total', () => {
    // Each of these is strong in one field only, and listed in the wrong order.
    const ratings: MayhemData['ratings'] = {
      e: [9, 1, 1, 1, 1], w: [1, 9, 1, 1, 1], c: [1, 1, 9, 1, 1], d: [1, 1, 1, 9, 1], f: [1, 1, 1, 1, 9],
    };
    const opp = opponent({ leaders: [], ratings, cells: [] }, [], 0, rng(1));
    expect(opp).toEqual(['e', 'w', 'c', 'd', 'f']);
    expect(teamTotal(opp, ratings)).toBe(45);
  });
  it('gets stronger round after round on average', () => {
    const big: MayhemData['ratings'] = Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`p${i}`, PORTFOLIOS.map((_, k) => 1 + ((i * 7 + k * 3) % 10))]));
    const data: MayhemData = { leaders: [], ratings: big, cells: [] };
    const mean = (round: number) => {
      const rand = rng(9);
      return Array.from({ length: 200 }, () => teamTotal(opponent(data, [], round, rand), big)).reduce((a, b) => a + b, 0) / 200;
    };
    expect(mean(1)).toBeGreaterThan(mean(0) + 1);
    expect(mean(2)).toBeGreaterThan(mean(1) + 1);
  });
});

describe('playNext', () => {
  it('needs a full team', () => {
    const run = newRun(2, DATA);
    expect(playNext(run, DATA)).toBe(run);
  });
  it('plays one match at a time and ends at the first defeat or after the final', () => {
    for (let seed = 1; seed <= 30; seed++) {
      let run = fill(newRun(seed, DATA));
      let guard = 0;
      while (!run.done && guard++ < 5) run = playNext(run, DATA);
      expect(run.done).toBe(true);
      expect(run.matches.length).toBeGreaterThanOrEqual(1);
      expect(run.matches.length).toBeLessThanOrEqual(3);
      expect(run.matches.slice(0, -1).every((m) => m.won)).toBe(true);
      if (run.matches.length < 3) expect(run.matches.at(-1)!.won).toBe(false);
      expect(playNext(run, DATA)).toBe(run);
    }
  });
  it('never sends the same leader twice against the player in one run', () => {
    const big: MayhemData['ratings'] = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`p${i}`, [5, 5, 5, 5, 5]]));
    const data: MayhemData = { ...DATA, ratings: { ...RATINGS, ...big } };
    for (let seed = 1; seed <= 20; seed++) {
      let run = fill(newRun(seed, data));
      run = { ...run, team: run.team, matches: [] };
      for (let round = 0; round < 3; round++) run = { ...playNext({ ...run, done: false }, data), done: false };
      const met = run.matches.flatMap((m) => m.opponent);
      expect(new Set(met).size).toBe(met.length);
    }
  });
  it('always fields five different leaders, even when few are rated', () => {
    for (let seed = 1; seed <= 20; seed++) {
      let run = fill(newRun(seed, DATA));
      for (let round = 0; round < 3; round++) run = { ...playNext({ ...run, done: false }, DATA), done: false };
      for (const m of run.matches) {
        expect(new Set(m.opponent).size).toBe(5);
        for (const id of m.opponent) expect(RATINGS[id]).toBeDefined();
      }
    }
  });
  it('gives the same tournament for the same seed and the same picks', () => {
    const play = () => {
      let run = fill(newRun(12, DATA));
      while (!run.done) run = playNext(run, DATA);
      return run;
    };
    expect(play()).toEqual(play());
  });
});

describe('runOutcome', () => {
  const base = fill(newRun(1, DATA));
  const m = (won: boolean) => ({ opponent: ['g1', 'd1', 'd2', 'b3', 'a4'], duels: [won, won, won, false, false], won });
  it('names how far the government went', () => {
    expect(runOutcome({ ...base, done: true, matches: [m(false)] })).toBe('quarter');
    expect(runOutcome({ ...base, done: true, matches: [m(true), m(false)] })).toBe('semi');
    expect(runOutcome({ ...base, done: true, matches: [m(true), m(true), m(false)] })).toBe('final');
    expect(runOutcome({ ...base, done: true, matches: [m(true), m(true), m(true)] })).toBe('champion');
  });
});

describe('teamTotal', () => {
  it('adds each leader’s rating on the portfolio they hold', () => {
    expect(teamTotal(['a1', 'a1', 'a1', 'a1', 'a1'], RATINGS)).toBe(3 + 9 + 8 + 7 + 8);
    expect(teamTotal(['b1', 'a1', 'a1', 'a1', 'a1'], RATINGS)).toBe(8 + 9 + 8 + 7 + 8);
  });
});

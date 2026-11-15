import { currentStreak, currentWinStreak, emptyStats, recordResult, recordStreak } from './stats';

describe('recordResult', () => {
  it('counts a win in the distribution and the win streak', () => {
    const s = recordResult(emptyStats(), 10, true, 4);
    expect(s).toEqual({ played: 1, wins: 1, cur: 1, best: 1, dist: { 4: 1 }, last: 10 });
  });
  it('continues the win streak on consecutive days', () => {
    const s = recordResult(recordResult(emptyStats(), 10, true, 4), 11, true, 2);
    expect(s).toMatchObject({ played: 2, wins: 2, cur: 2, best: 2, dist: { 4: 1, 2: 1 } });
  });
  it('restarts the win streak after a skipped day', () => {
    const s = recordResult(recordResult(emptyStats(), 10, true, 4), 12, true, 2);
    expect(s).toMatchObject({ cur: 1, best: 1 });
  });
  it('a loss resets the win streak but keeps the best', () => {
    let s = recordResult(emptyStats(), 10, true, 4);
    s = recordResult(s, 11, true, 4);
    s = recordResult(s, 12, false, 8);
    expect(s).toMatchObject({ played: 3, wins: 2, cur: 0, best: 2 });
  });
  it('records a puzzle only once', () => {
    const s = recordResult(emptyStats(), 10, true, 4);
    expect(recordResult(s, 10, true, 4)).toBe(s);
  });
});

describe('currentWinStreak', () => {
  it('counts until the day after the last game, then drops to 0', () => {
    const s = recordResult(recordResult(emptyStats(), 10, true, 4), 11, true, 2);
    expect(currentWinStreak(s, 11)).toBe(2);
    expect(currentWinStreak(s, 12)).toBe(2);
    expect(currentWinStreak(s, 13)).toBe(0);
  });
});

describe('streak (Classic finished, won or lost)', () => {
  it('grows on consecutive days and restarts after a gap', () => {
    let s = recordStreak({ n: 0, last: 0 }, 10);
    s = recordStreak(s, 11);
    expect(s).toEqual({ n: 2, last: 11 });
    expect(recordStreak(s, 11)).toBe(s);
    expect(recordStreak(s, 13)).toEqual({ n: 1, last: 13 });
  });
  it('is still shown the day after, and drops to 0 after a missed day', () => {
    const s = { n: 5, last: 10 };
    expect(currentStreak(s, 10)).toBe(5);
    expect(currentStreak(s, 11)).toBe(5);
    expect(currentStreak(s, 12)).toBe(0);
  });
});

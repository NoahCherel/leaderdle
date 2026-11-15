import { classicStatus, successionStatus, timelineStatus } from './status';

describe('status', () => {
  it('Classic is won when the answer was guessed', () => {
    expect(classicStatus(['lky', 'tha', 'man', 'mer'], 'mer')).toEqual({ won: true, lost: false, done: true, used: 4 });
  });
  it('Classic is lost after 8 misses', () => {
    const g = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    expect(classicStatus(g, 'mer')).toMatchObject({ lost: true, done: true, used: 8 });
    expect(classicStatus(g.slice(0, 7), 'mer')).toMatchObject({ lost: false, done: false });
  });
  it('Succession is lost after 5 misses', () => {
    expect(successionStatus(['a', 'b', 'c', 'd', 'e'], 'mer')).toMatchObject({ lost: true, used: 5 });
    expect(successionStatus(['lky', 'mer'], 'mer')).toMatchObject({ won: true, used: 2 });
  });
  it('Timeline locks the last check and ends after 3 checks', () => {
    expect(timelineStatus([[1, 0, 1, 0, 1]])).toMatchObject({ done: false, used: 1, locked: [1, 0, 1, 0, 1] });
    expect(timelineStatus([[1, 0, 1, 0, 1], [1, 1, 1, 1, 1]])).toMatchObject({ won: true, used: 2 });
    expect(timelineStatus([[1, 0, 1, 0, 1], [1, 0, 1, 0, 1], [1, 0, 1, 0, 1]])).toMatchObject({ lost: true, done: true });
    expect(timelineStatus([]).locked).toEqual([0, 0, 0, 0, 0]);
  });
});

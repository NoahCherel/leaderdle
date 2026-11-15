import { initialState, reducer, type GameState } from './state';
import type { DayPuzzle } from '../data/schema';

const puzzle: DayPuzzle = {
  n: 128,
  classic: { answer: 'mer' },
  letters: { answer: 'oba', word: 'OBAMA' },
  succession: { before: 'sch', answer: 'mer', after: 'olz', years: '2005 – 2021', beforeYears: '1998 – 2005', afterYears: '2021 – 2025' },
  timeline: { order: ['lky', 'tha', 'man', 'mer', 'ard'], start: ['man', 'ard', 'lky', 'mer', 'tha'] },
};

const started = (): GameState => reducer(initialState(), { type: 'start', puzzle });
const run = (s: GameState, ...actions: Parameters<typeof reducer>[1][]) => actions.reduce(reducer, s);
const guess = (mode: 'classic' | 'succession', id: string) => ({ type: 'guess' as const, n: 128, mode, id });

describe('start', () => {
  it('creates today with the shuffled Timeline order', () => {
    const s = started();
    expect(s.days[128]).toMatchObject({ classic: [], succession: [], order: puzzle.timeline.start, checks: [], hint: false });
  });
  it('keeps a game already started today', () => {
    const s = run(started(), guess('classic', 'lky'), { type: 'start', puzzle });
    expect(s.days[128]!.classic).toEqual(['lky']);
  });
  it('forgets days older than a week', () => {
    let s = reducer(initialState(), { type: 'start', puzzle: { ...puzzle, n: 120 } });
    s = reducer(s, { type: 'start', puzzle });
    expect(Object.keys(s.days)).toEqual(['128']);
    s = reducer(reducer(initialState(), { type: 'start', puzzle: { ...puzzle, n: 122 } }), { type: 'start', puzzle });
    expect(Object.keys(s.days).sort()).toEqual(['122', '128']);
  });
});

describe('guess', () => {
  it('adds a guess once', () => {
    const s = run(started(), guess('classic', 'lky'), guess('classic', 'lky'));
    expect(s.days[128]!.classic).toEqual(['lky']);
  });
  it('ignores guesses after the game is over', () => {
    const s = run(started(), guess('classic', 'mer'), guess('classic', 'lky'));
    expect(s.days[128]!.classic).toEqual(['mer']);
  });
  it('ignores an unknown day', () => {
    const s = started();
    expect(reducer(s, { ...guess('classic', 'lky'), n: 127 })).toBe(s);
  });
  it('records stats and the streak when Classic ends, once', () => {
    const s = run(started(), guess('classic', 'lky'), guess('classic', 'mer'));
    expect(s.stats.classic).toMatchObject({ played: 1, wins: 1, dist: { 2: 1 }, last: 128 });
    expect(s.streak).toEqual({ n: 1, last: 128 });
  });
  it('counts a Classic loss in the streak', () => {
    const s = run(started(), ...['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => guess('classic', id)));
    expect(s.stats.classic).toMatchObject({ played: 1, wins: 0 });
    expect(s.streak.n).toBe(1);
  });
  it('any finished game counts for the day streak, once a day', () => {
    const s = run(started(), guess('succession', 'mer'));
    expect(s.stats.succession).toMatchObject({ played: 1, wins: 1 });
    expect(s.streak.n).toBe(1);
    expect(run(s, guess('classic', 'mer')).streak.n).toBe(1);
  });
});

describe('letters', () => {
  const spell = (guess: string) => ({ type: 'letters' as const, n: 128, guess });
  it('keeps a full guess and wins on the exact word', () => {
    const s = run(started(), spell('ABOUT'), spell('OBAMA'));
    expect(s.days[128]!.letters).toEqual(['ABOUT', 'OBAMA']);
    expect(s.stats.letters).toMatchObject({ played: 1, wins: 1, dist: { 2: 1 } });
  });
  it('ignores a guess that does not fit the word', () => {
    const s = run(started(), spell('OBAM'), spell('obama'), spell('OB MA'));
    expect(s.days[128]!.letters).toEqual([]);
  });
  it('is lost after six wrong guesses, and takes no more', () => {
    const s = run(started(), ...Array.from({ length: 7 }, () => spell('ABOUT')));
    expect(s.days[128]!.letters).toHaveLength(6);
    expect(s.stats.letters).toMatchObject({ played: 1, wins: 0 });
  });
});

describe('hint', () => {
  it('turns the hint on', () => {
    expect(run(started(), { type: 'hint', n: 128 }).days[128]!.hint).toBe(true);
  });
});

describe('Timeline', () => {
  it('moves cards and checks the order', () => {
    let s = run(started(), { type: 'order', n: 128, order: ['lky', 'mer', 'man', 'tha', 'ard'] }, { type: 'check', n: 128 });
    expect(s.days[128]!.checks).toEqual([[1, 0, 1, 0, 1]]);
    s = run(s, { type: 'order', n: 128, order: puzzle.timeline.order }, { type: 'check', n: 128 });
    expect(s.stats.timeline).toMatchObject({ wins: 1, dist: { 2: 1 } });
  });
  it('refuses an order that moves a locked card', () => {
    const s = run(started(), { type: 'order', n: 128, order: ['lky', 'mer', 'man', 'tha', 'ard'] }, { type: 'check', n: 128 });
    expect(reducer(s, { type: 'order', n: 128, order: ['mer', 'lky', 'man', 'tha', 'ard'] })).toBe(s);
  });
  it('refuses an order that is not a permutation', () => {
    const s = started();
    expect(reducer(s, { type: 'order', n: 128, order: ['lky', 'lky', 'man', 'tha', 'ard'] })).toBe(s);
  });
  it('does not spend a check on an order that was already checked (double tap)', () => {
    const s = run(started(), { type: 'check', n: 128 }, { type: 'check', n: 128 });
    expect(s.days[128]!.checks).toHaveLength(1);
  });
  it('stops after three checks', () => {
    const o1 = ['ard', 'lky', 'man', 'mer', 'tha'];
    const o2 = ['ard', 'tha', 'man', 'mer', 'lky'];
    const s = run(started(), { type: 'check', n: 128 }, { type: 'order', n: 128, order: o1 }, { type: 'check', n: 128 }, { type: 'order', n: 128, order: o2 }, { type: 'check', n: 128 }, { type: 'check', n: 128 });
    expect(s.days[128]!.checks).toHaveLength(3);
    expect(s.stats.timeline).toMatchObject({ played: 1, wins: 0 });
  });
});

describe('replace (another tab saved)', () => {
  it('takes the other tab’s state and keeps today loaded', () => {
    const other = reducer(initialState(), { type: 'setting', key: 'dark', value: true });
    const s = reducer(run(started(), guess('classic', 'lky')), { type: 'replace', state: other, puzzle });
    expect(s.settings.dark).toBe(true);
    expect(s.days[128]).toMatchObject({ classic: [] });
  });
});

describe('settings and data', () => {
  it('toggles a setting', () => {
    expect(reducer(initialState(), { type: 'setting', key: 'dark', value: true }).settings.dark).toBe(true);
  });
  it('clear erases games, streak and stats but keeps preferences', () => {
    let s = run(started(), guess('classic', 'mer'), { type: 'setting', key: 'cb', value: true }, { type: 'consent', value: 'no' }, { type: 'helpSeen', mode: 'classic' });
    s = reducer(s, { type: 'clear' });
    // Today's puzzle stays loaded, with a fresh game.
    expect(s.days[128]).toMatchObject({ classic: [], succession: [], checks: [], hint: false, order: puzzle.timeline.start, puzzle });
    expect(s.stats.classic.played).toBe(0);
    expect(s.streak.n).toBe(0);
    expect(s.settings.cb).toBe(true);
    expect(s.consent).toBe('no');
    expect(s.helpSeen.classic).toBe(true);
  });
});

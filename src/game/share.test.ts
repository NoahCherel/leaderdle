import { classicEmoji, shareClassic, shareDay, shareSuccession, shareTimeline, shareLetters } from './share';
import type { Direction, TileState } from './types';

const row = (spec: string) =>
  spec.split(' ').map((s) => {
    const state: TileState = s === 'g' ? 'correct' : s === 'y' ? 'close' : 'miss';
    const dir: Direction = s === 'u' ? 'up' : s === 'd' ? 'down' : null;
    return { state, dir };
  });

describe('Classic share text (PASSATION §9)', () => {
  const rows = [row('x g u d u'), row('y g u u y'), row('x y u u d'), row('g g g g g')];

  it('maps tiles to emoji, arrows only on numeric misses', () => {
    expect(classicEmoji(row('x g u d u'))).toBe('⬜🟩⬆️⬇️⬆️');
  });

  it('matches the documented example', () => {
    expect(shareClassic(128, rows, { won: true, used: 4 }, false)).toBe(
      'Leaderdle #128 · Classic 4/8\n⬜🟩⬆️⬇️⬆️\n🟧🟩⬆️⬆️🟧\n⬜🟧⬆️⬆️⬇️\n🟩🟩🟩🟩🟩\nleaderdle.com',
    );
  });

  it('uses X on a loss and a bulb when the hint was used', () => {
    expect(shareClassic(128, [row('x x x x x')], { won: false, used: 8 }, true).split('\n')[0]).toBe(
      'Leaderdle #128 · Classic X/8 💡',
    );
  });
});

describe('bonus and day share text (brief §7)', () => {
  it('Succession is one line, one square per guess', () => {
    expect(shareSuccession(128, ['lky', 'mer'], 'mer', { won: true, used: 2 })).toBe(
      'Leaderdle #128 · Succession 2/5\n⬜🟩\nleaderdle.com',
    );
  });
  it('Timeline is one line per check', () => {
    expect(shareTimeline(128, [[1, 0, 1, 0, 1], [1, 1, 1, 1, 1]], { won: true, used: 2 })).toBe(
      'Leaderdle #128 · Timeline 2/3\n🟩⬜🟩⬜🟩\n🟩🟩🟩🟩🟩\nleaderdle.com',
    );
  });
  it('Letters: one square per letter, a space between words', () => {
    expect(
      shareLetters(128, [['absent', 'present', 'gap', 'correct'], ['correct', 'correct', 'gap', 'correct']], { won: true, used: 2 }),
    ).toBe('Leaderdle #128 · Letters 2/6\n⬛🟧 🟩\n🟩🟩 🟩\nleaderdle.com');
  });
  it('the day summary fits on one line', () => {
    expect(
      shareDay(128, {
        classic: { won: true, used: 4 },
        letters: { won: true, used: 3 },
        succession: { won: true, used: 2 },
        timeline: { won: false, used: 3 },
      }),
    ).toBe('Leaderdle #128\nClassic 4/8 · Letters 3/6 · Succession 2/5 · Timeline X/3\nleaderdle.com');
  });
});

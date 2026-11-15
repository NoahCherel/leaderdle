import { DayPuzzleSchema } from './schema';

const day = {
  n: 1,
  classic: { answer: 'a' },
  letters: { answer: 'j', word: 'DE GAULLE' },
  succession: { before: 'b', answer: 'c', after: 'd', years: '1 – 2', beforeYears: '0 – 1', afterYears: '2 – 3' },
  timeline: { order: ['e', 'f', 'g', 'h', 'i'], start: ['f', 'e', 'h', 'i', 'g'] },
};

describe('DayPuzzleSchema', () => {
  it('accepts a valid day', () => {
    expect(DayPuzzleSchema.safeParse(day).success).toBe(true);
  });
  it('rejects a Letters word with anything but capitals and single spaces', () => {
    for (const word of ['de Gaulle', 'DE  GAULLE', 'BEN-GURION', ' OBAMA', '']) {
      expect(DayPuzzleSchema.safeParse({ ...day, letters: { answer: 'j', word } }).success).toBe(false);
    }
  });
  it('rejects a Timeline start that is not the same five cards', () => {
    const dup = { ...day, timeline: { ...day.timeline, start: ['f', 'f', 'h', 'i', 'g'] } };
    const other = { ...day, timeline: { ...day.timeline, start: ['f', 'e', 'h', 'i', 'x'] } };
    const dupOrder = { ...day, timeline: { order: ['e', 'e', 'g', 'h', 'i'], start: ['e', 'g', 'e', 'i', 'h'] } };
    expect(DayPuzzleSchema.safeParse(dup).success).toBe(false);
    expect(DayPuzzleSchema.safeParse(other).success).toBe(false);
    expect(DayPuzzleSchema.safeParse(dupOrder).success).toBe(false);
  });
});

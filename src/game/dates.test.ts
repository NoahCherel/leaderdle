import { countdown, dayKey, puzzleNumber } from './dates';

describe('puzzleNumber (local date, new puzzle at local midnight)', () => {
  it('is 1 on launch day and counts days after', () => {
    expect(puzzleNumber(new Date(2026, 6, 11, 0, 0, 1), '2026-07-11')).toBe(1);
    expect(puzzleNumber(new Date(2026, 6, 11, 23, 59, 59), '2026-07-11')).toBe(1);
    expect(puzzleNumber(new Date(2026, 6, 12, 0, 0, 0), '2026-07-11')).toBe(2);
    expect(puzzleNumber(new Date(2026, 10, 15, 12), '2026-07-11')).toBe(128);
  });
  it('is not shifted by daylight saving changes', () => {
    expect(puzzleNumber(new Date(2026, 2, 30, 0, 30), '2026-03-01')).toBe(30);
    expect(puzzleNumber(new Date(2026, 9, 26, 23, 30), '2026-10-01')).toBe(26);
  });
  it('is 0 or less before launch', () => {
    expect(puzzleNumber(new Date(2026, 6, 10), '2026-07-11')).toBe(0);
  });
});

describe('dayKey', () => {
  it('formats the local date', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('countdown', () => {
  it('shows time to the next local midnight', () => {
    expect(countdown(new Date(2026, 10, 15, 16, 17, 44))).toBe('07:42:16');
    expect(countdown(new Date(2026, 10, 15, 23, 59, 59))).toBe('00:00:01');
  });
});

import { describe, expect, it } from 'vitest';
import { fitsWord, keyStates, lettersWord, scoreLetters } from './letters';

describe('scoreLetters', () => {
  it('marks letters in the right place as correct', () => {
    expect(scoreLetters('MERKEL', 'MERKEL')).toEqual(['correct', 'correct', 'correct', 'correct', 'correct', 'correct']);
  });

  it('marks a letter found elsewhere as present, and the others as absent', () => {
    expect(scoreLetters('MACRON', 'MERKEL')).toEqual(['correct', 'absent', 'absent', 'present', 'absent', 'absent']);
  });

  it('never marks more copies of a letter than the answer holds', () => {
    // MERKEL has two E: the first two E of the guess use them up, the third gets nothing.
    expect(scoreLetters('EEEXXX', 'MERKEL')).toEqual(['present', 'correct', 'absent', 'absent', 'absent', 'absent']);
  });

  it('gives a correct letter priority over an earlier copy', () => {
    expect(scoreLetters('LLAMA', 'BLAIR')).toEqual(['absent', 'correct', 'correct', 'absent', 'absent']);
  });

  it('keeps the space between words as a gap', () => {
    expect(scoreLetters('LA GAULLE', 'DE GAULLE')).toEqual(['absent', 'absent', 'gap', 'correct', 'correct', 'correct', 'correct', 'correct', 'correct']);
  });
});

describe('keyStates', () => {
  it('keeps the best result seen for each letter', () => {
    const keys = keyStates(['MACRON', 'KERNEL'], 'MERKEL');
    expect(keys.M).toBe('correct');
    expect(keys.R).toBe('correct');
    expect(keys.K).toBe('present');
    expect(keys.A).toBe('absent');
    expect(keys.Z).toBeUndefined();
  });
});

describe('fitsWord', () => {
  it('accepts letters in every slot with the spaces in place', () => {
    expect(fitsWord('AB CDEFGH', 'DE GAULLE')).toBe(true);
  });
  it('refuses a wrong length, a moved space, or anything but capital letters', () => {
    expect(fitsWord('MERKE', 'MERKEL')).toBe(false);
    expect(fitsWord('ABC DEFGH', 'DE GAULLE')).toBe(false);
    expect(fitsWord('MERKE1', 'MERKEL')).toBe(false);
    expect(fitsWord('merkel', 'MERKEL')).toBe(false);
  });
  it('refuses a guess that is too long', () => {
    expect(fitsWord('MERKELX', 'MERKEL')).toBe(false);
  });
  it('refuses a letter where the answer has a space, even with every other slot filled', () => {
    expect(fitsWord('ABCDEFGHI', 'DE GAULLE')).toBe(false);
  });
});

describe('lettersWord', () => {
  it('drops accents and punctuation', () => {
    expect(lettersWord('Erdoğan')).toBe('ERDOGAN');
    expect(lettersWord('Ceaușescu')).toBe('CEAUSESCU');
    expect(lettersWord('Wałęsa')).toBe('WALESA');
    expect(lettersWord('Ben-Gurion')).toBe('BEN GURION');
    expect(lettersWord(' de  Gaulle ')).toBe('DE GAULLE');
  });
});

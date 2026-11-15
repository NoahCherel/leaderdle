import { isInOffice, yearsInOffice } from './tenure';
import type { Direction, Leader, Role, Tile, TileState } from './types';

export const ROLE_LABEL: Record<Role, [full: string, short: string]> = {
  gov: ['Head of government', 'Gov'],
  state: ['Head of state', 'State'],
  both: ['Both', 'Both'],
};

const WORD: Record<TileState, string> = { correct: 'correct', close: 'close', miss: 'no match' };

const plain = (key: Tile['key'], label: string, value: string, short: string, state: TileState): Tile => ({
  key, label, value, short, state, dir: null, numeric: false, inOffice: false,
  aria: `${label}: ${value}, ${WORD[state]}`,
});

const numeric = (
  key: Tile['key'], label: string, guess: number, target: number, threshold: number,
  more: string, less: string, inOffice = false,
): Tile => {
  const d = target - guess;
  const state: TileState = d === 0 ? 'correct' : Math.abs(d) <= threshold ? 'close' : 'miss';
  const dir: Direction = d > 0 ? 'up' : d < 0 ? 'down' : null;
  const value = String(guess);
  const parts = [`${label}: ${value}`];
  if (inOffice) parts.push('still in office');
  if (dir) {
    if (state === 'close') parts.push('close');
    parts.push(`target is ${dir === 'up' ? more : less}`);
  } else parts.push(WORD[state]);
  return { key, label, value, short: value, state, dir, numeric: true, inOffice, aria: parts.join(', ') };
};

/** Compares a guess with the answer, tile by tile (PASSATION §5, Classic). */
export function compare(guess: Leader, answer: Leader, today: Date): Tile[] {
  const role: TileState = guess.role === answer.role ? 'correct'
    : guess.role === 'both' || answer.role === 'both' ? 'close' : 'miss';
  const country: TileState = guess.country === answer.country ? 'correct'
    : guess.continent === answer.continent ? 'close' : 'miss';
  return [
    plain('country', 'Country', guess.country, guess.countryCode, country),
    plain('role', 'Role', ROLE_LABEL[guess.role][0], ROLE_LABEL[guess.role][1], role),
    numeric('took', 'Took office', guess.tookOffice, answer.tookOffice, 10, 'later', 'earlier'),
    numeric('years', 'Years in office', yearsInOffice(guess, today), yearsInOffice(answer, today), 2, 'more', 'fewer', isInOffice(guess)),
    numeric('age', 'Age at start', guess.ageAtStart, answer.ageAtStart, 5, 'older', 'younger'),
  ];
}

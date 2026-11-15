import { MAX } from './types';

export interface Status {
  won: boolean;
  lost: boolean;
  done: boolean;
  used: number;
}

export interface TimelineStatus extends Status {
  locked: number[];
}

const guessStatus = (guesses: readonly string[], answer: string, max: number): Status => {
  const won = guesses.includes(answer);
  const lost = !won && guesses.length >= max;
  return { won, lost, done: won || lost, used: guesses.length };
};

export const classicStatus = (guesses: readonly string[], answer: string) => guessStatus(guesses, answer, MAX.classic);
export const successionStatus = (guesses: readonly string[], answer: string) => guessStatus(guesses, answer, MAX.succession);

/** Letters is won by spelling the word exactly. */
export const lettersStatus = (guesses: readonly string[], word: string) => guessStatus(guesses, word, MAX.letters);

export function timelineStatus(checks: readonly (readonly number[])[]): TimelineStatus {
  const last = checks[checks.length - 1];
  const won = !!last && last.every(Boolean);
  const lost = !won && checks.length >= MAX.timeline;
  return { won, lost, done: won || lost, used: checks.length, locked: last ? [...last] : [0, 0, 0, 0, 0] };
}

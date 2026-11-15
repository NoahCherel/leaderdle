/** Letters mode: spell the leader's name, Wordle style. Words are capital A–Z with single spaces. */
export type LetterState = 'correct' | 'present' | 'absent' | 'gap';
export type KeyState = Exclude<LetterState, 'gap'>;

/** One state per character. A letter is never marked more times than the answer holds it. */
export function scoreLetters(guess: string, word: string): LetterState[] {
  const out: LetterState[] = [];
  const spare = new Map<string, number>();
  for (let i = 0; i < word.length; i++) {
    const w = word[i]!;
    if (w === ' ') out[i] = 'gap';
    else if (guess[i] === w) out[i] = 'correct';
    else spare.set(w, (spare.get(w) ?? 0) + 1);
  }
  for (let i = 0; i < word.length; i++) {
    if (out[i]) continue;
    const g = guess[i] ?? '';
    const left = spare.get(g) ?? 0;
    out[i] = left > 0 ? 'present' : 'absent';
    if (left > 0) spare.set(g, left - 1);
  }
  return out;
}

const RANK: Record<KeyState, number> = { absent: 0, present: 1, correct: 2 };

/** Best result seen so far for each letter, to color the keyboard. */
export function keyStates(guesses: readonly string[], word: string): Record<string, KeyState> {
  const keys: Record<string, KeyState> = {};
  for (const guess of guesses) {
    scoreLetters(guess, word).forEach((state, i) => {
      if (state === 'gap') return;
      const letter = guess[i]!;
      const old = keys[letter];
      if (!old || RANK[state] > RANK[old]) keys[letter] = state;
    });
  }
  return keys;
}

/** A full guess: a capital letter in every slot, spaces where the answer has them. */
export function fitsWord(guess: string, word: string): boolean {
  if (guess.length !== word.length) return false;
  for (let i = 0; i < word.length; i++) {
    if (word[i] === ' ' ? guess[i] !== ' ' : !/^[A-Z]$/.test(guess[i]!)) return false;
  }
  return true;
}

const SPECIAL: Record<string, string> = { ł: 'l', Ł: 'L', đ: 'd', Đ: 'D', ø: 'o', Ø: 'O', ß: 'ss', æ: 'ae', Æ: 'AE', œ: 'oe', Œ: 'OE', ı: 'i' };

/** A name as played: capitals, no accents, anything else becomes a space. */
export function lettersWord(name: string): string {
  return name
    .replace(/[łŁđĐøØßæÆœŒı]/g, (c) => SPECIAL[c]!)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]+/g, ' ')
    .trim();
}

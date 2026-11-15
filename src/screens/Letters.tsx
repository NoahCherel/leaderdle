import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app/context';
import { IconBack } from '../components/icons';
import { keyStates, scoreLetters, type LetterState } from '../game/letters';
import { shareLetters } from '../game/share';
import { MAX } from '../game/types';
import { GameLayout, LeaderCard, Result, ResumedBanner, TitleRow, gameStyles as s, leftLabel, type GridCell } from './GameParts';

const KEYS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
/** Delay between two tiles turning over, and the length of one turn. */
const STEP = 110;
const TURN = 380;
const STATE_WORD: Record<LetterState, string> = { correct: 'right place', present: 'wrong place', absent: 'not in the name', gap: '' };
const KIND: Record<LetterState, GridCell['kind']> = { correct: 'g', present: 'y', absent: 'x', gap: 'gap' };

/** Clues unlocked by misses, so a blank start is never a dead end. */
const CLUE_AFTER = [2, 4] as const;

/** Lays the typed letters over the word's shape, spaces included. */
function shape(word: string, typed: readonly string[]): string[] {
  let k = 0;
  return [...word].map((c) => (c === ' ' ? ' ' : (typed[k++] ?? '')));
}

export function Letters() {
  const { day, status, byId, dispatch, n, fresh, markFresh, frozen, state, modal } = useApp();
  const st = status.letters;
  const word = day.puzzle.letters.word;
  const answer = byId(day.puzzle.letters.answer);
  const guesses = day.letters;
  const slots = word.replace(/ /g, '').length;
  const words = word.split(' ').length;
  const still = frozen || state.settings.reduce;

  const [typed, setTyped] = useState<string[]>([]);
  const [shake, setShake] = useState(0);
  const [note, setNote] = useState('');
  const [revealing, setRevealing] = useState(false);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const scored = useMemo(() => guesses.map((g) => scoreLetters(g, word)), [guesses, word]);
  // While the last row is still turning over, the keyboard keeps its previous colors.
  const keys = useMemo(() => keyStates(revealing ? guesses.slice(0, -1) : guesses, word), [guesses, word, revealing]);
  const freshRow = fresh?.mode === 'letters' ? Number(fresh.id) : -1;
  const open = !st.done;

  const press = useCallback(
    (letter: string) => {
      if (!open) return;
      setNote('');
      setTyped((t) => (t.length < slots ? [...t, letter] : t));
    },
    [open, slots],
  );
  const back = useCallback(() => {
    if (!open) return;
    setNote('');
    setTyped((t) => t.slice(0, -1));
  }, [open]);
  const enter = useCallback(() => {
    if (!open) return;
    if (typed.length < slots) {
      setShake((k) => k + 1);
      setNote(`Fill all ${slots} letters first.`);
      return;
    }
    dispatch({ type: 'letters', n, guess: shape(word, typed).join('') });
    markFresh('letters', String(guesses.length));
    setTyped([]);
    setNote('');
    if (!still) {
      setRevealing(true);
      timer.current = window.setTimeout(() => setRevealing(false), slots * STEP + TURN);
    }
  }, [open, typed, slots, dispatch, n, word, markFresh, guesses.length, still]);

  // Physical keyboard. Enter on a focused button or link keeps its normal meaning.
  useEffect(() => {
    if (modal.kind) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toUpperCase());
      else if (e.key === 'Backspace') back();
      else if (e.key === 'Enter' && tag !== 'BUTTON' && tag !== 'A') enter();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal.kind, press, back, enter]);

  const columns = [...word].map((c) => (c === ' ' ? '10px' : 'minmax(0, 54px)')).join(' ');
  const rowStyle = { gridTemplateColumns: columns, ['--n' as string]: word.length };
  const misses = guesses.filter((g) => g !== word).length;
  const clues: Array<[string, string]> = [
    ['Continent', answer.continent],
    ['Country', answer.country],
  ];
  const showResult = st.done && !revealing;
  const last = scored[scored.length - 1];

  return (
    <GameLayout mode="letters">
      <TitleRow mode="letters" left={leftLabel('letters', showResult ? st : { won: false, lost: false, used: revealing ? st.used - 1 : st.used })} />
      {showResult && (
        <Result
          mode="letters"
          won={st.won}
          used={st.used}
          scoreLine={st.won ? `Spelled in ${st.used} of ${MAX.letters} ${st.used === 1 ? 'guess' : 'guesses'}` : `Out of guesses. The name was ${word}.`}
          celebrate={st.won && freshRow === guesses.length - 1}
          grid={scored.map((row) => row.map((c) => ({ kind: KIND[c] })))}
          shareText={shareLetters(n, scored, st)}
        >
          <LeaderCard leader={answer} />
        </Result>
      )}
      <ResumedBanner mode="letters" />
      {!st.done && (
        <p className={s.brief}>
          Spell the name of today's leader: <strong>{slots} letters</strong>
          {words > 1 ? `, ${words} words` : ''}. Any letters will do, there is no list to pick from.
        </p>
      )}
      <div className={s.board}>
        {Array.from({ length: MAX.letters }, (_, i) => {
          const done = i < guesses.length;
          const current = i === guesses.length && !st.done;
          const chars = done ? [...guesses[i]!] : current ? shape(word, typed) : shape(word, []);
          const states = done ? scored[i]! : null;
          const turn = done && i === freshRow && !still;
          const label = done
            ? `Guess ${i + 1}: ${chars.map((c, k) => (c === ' ' ? '' : `${c} ${STATE_WORD[states![k]!]}`)).filter(Boolean).join(', ')}`
            : current
              ? `Guess ${i + 1}, being typed: ${typed.join('') || 'empty'}`
              : `Guess ${i + 1}: empty`;
          return (
            <div
              key={current ? `${i}-${shake}` : i}
              role="group"
              aria-label={label}
              className={`${s.lrow} ${current && shake ? s.lshake : ''}`}
              style={rowStyle}
            >
              {chars.map((c, k) => {
                if (word[k] === ' ') return <span key={k} aria-hidden="true" />;
                const cls = [s.lcell, states ? s[`l_${states[k]}`] : c ? s.lfilled : '', turn ? s.lturn : '', current && c && k === lastTypedIndex(word, typed.length) ? s.lpop : ''];
                return (
                  <span key={k} aria-hidden="true" className={cls.filter(Boolean).join(' ')} style={turn ? { animationDelay: `${letterIndex(word, k) * STEP}ms` } : undefined}>
                    {c}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
      <p role="status" className={s.lnote}>
        {note || (last && !revealing && !st.done ? `${last.filter((c) => c === 'correct').length} in the right place, ${last.filter((c) => c === 'present').length} elsewhere in the name.` : '')}
      </p>
      {!st.done && (
        <div className={s.keys} role="group" aria-label="Keyboard">
          {KEYS.map((row, r) => (
            <div key={row} className={s.krow}>
              {r === 2 && (
                <button type="button" className={`${s.key} ${s.keyWide} ${s.keyGo}`} onClick={enter}>
                  Enter
                </button>
              )}
              {[...row].map((k) => (
                <button key={k} type="button" className={`${s.key} ${keys[k] ? s[`k_${keys[k]}`] : ''}`} aria-label={keys[k] ? `${k}, ${STATE_WORD[keys[k]!]}` : k} onClick={() => press(k)}>
                  {k}
                </button>
              ))}
              {r === 2 && (
                <button type="button" className={`${s.key} ${s.keyWide}`} aria-label="Delete the last letter" onClick={back}>
                  <IconBack size={22} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className={s.stack} style={{ gap: 8 }}>
        <strong className="eyebrow muted">Clues</strong>
        <div className={s.clues}>
          {clues.map(([label, value], i) => {
            const shown = st.done || misses >= CLUE_AFTER[i]!;
            return (
              <div key={label} className={`${s.clue} ${shown ? s.clueOn : ''}`}>
                <span className="eyebrow">{label}</span>
                <strong>{shown ? value : `Unlocks after miss ${CLUE_AFTER[i]}`}</strong>
              </div>
            );
          })}
        </div>
      </div>
    </GameLayout>
  );
}

/** Position among letters only (spaces skipped), to stagger the turn. */
function letterIndex(word: string, k: number): number {
  return [...word.slice(0, k)].filter((c) => c !== ' ').length;
}

/** Index in the word of the letter typed last. */
function lastTypedIndex(word: string, count: number): number {
  let seen = 0;
  for (let k = 0; k < word.length; k++) {
    if (word[k] === ' ') continue;
    seen++;
    if (seen === count) return k;
  }
  return -1;
}

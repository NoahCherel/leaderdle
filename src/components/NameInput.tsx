import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { matchedAlias } from '../game/search';
import { termSpan } from '../game/tenure';
import type { Leader } from '../game/types';
import s from './NameInput.module.css';

const LIMIT = 50;
export const DEFAULT_HELP = 'Start typing, or pick a name from the list.';

interface Props {
  label: string;
  tried: readonly string[];
  search: (q: string) => Leader[];
  onSubmit: (id: string) => void;
  /** Mode color for the Guess button. */
  color?: string;
  help?: string;
  initialQuery?: string;
  initialOpen?: boolean;
  /** On phones, bring the field to the top so suggestions and the last guess stay above the keyboard. */
  scrollOnFocus?: boolean;
}

/** Name field with suggestions, shared by Classic and Succession (PASSATION §6). */
export function NameInput({ label, tried, search, onSubmit, color = 'var(--m1)', help = DEFAULT_HELP, initialQuery = '', initialOpen = false, scrollOnFocus = false }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const [q, setQ] = useState(initialQuery);
  const [open, setOpen] = useState(initialOpen);
  const [msg, setMsg] = useState('');
  const [shake, setShake] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => search(q), [search, q]);
  // An empty field lists nobody: thousands of names in notability order would favour some leaders.
  const shown = q.trim() ? matches.slice(0, LIMIT) : [];
  const isTried = (l: Leader) => tried.includes(l.id);
  const [active, setActive] = useState<number>(-1);
  // The best match is active by default, unless it was already guessed: Enter must never swap in another leader.
  const current = active >= 0 && active < shown.length && !isTried(shown[active]!) ? active : shown[0] && !isTried(shown[0]) ? 0 : -1;

  const invalid = (text: string) => {
    setMsg(text);
    setShake((k) => k + 1);
  };

  const submit = (leader: Leader) => {
    onSubmit(leader.id);
    setQ('');
    setActive(-1);
    setMsg('');
    setOpen(false);
  };

  const tryGuess = () => {
    if (!q.trim()) {
      setOpen(true);
      return invalid('Type a name, or pick one from the list.');
    }
    if (!matches.length) return invalid('No leader found. Check the spelling?');
    const pick = current >= 0 ? shown[current] : undefined;
    if (!pick) return invalid(`You already tried ${matches[0]!.name}.`);
    submit(pick);
  };

  const step = (dir: 1 | -1) => {
    let i = current;
    for (let k = 0; k < shown.length; k++) {
      i += dir;
      if (i < 0 || i >= shown.length) return;
      if (!isTried(shown[i]!)) return setActive(i);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      else step(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      step(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      tryGuess();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const optionId = (i: number) => `${id}-opt-${i}`;

  return (
    <div className={s.wrap}>
      <label htmlFor={`${id}-input`} className={s.label}>
        {label}
      </label>
      <div ref={boxRef} className={`${s.box} ${shake ? (shake % 2 ? s.shake : s.shake2) : ''}`}>
        <input
          id={`${id}-input`}
          className={s.input}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="words"
          spellCheck={false}
          enterKeyHint="go"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && current >= 0 ? optionId(current) : undefined}
          placeholder="Type a name"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
            setMsg('');
          }}
          onFocus={() => {
            setOpen(true);
            if (scrollOnFocus) boxRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
          }}
          onClick={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
        <button type="button" className="btn btn--md" style={{ ['--btn-bg' as string]: color }} onClick={tryGuess}>
          Guess
        </button>
        {open && (
          <div id={listId} role="listbox" aria-label="Suggestions" className={s.list}>
            {shown.map((l, i) => {
              const done = isTried(l);
              return (
                <div
                  key={l.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === current}
                  aria-disabled={done || undefined}
                  className={[s.option, i === current && s.active, done && s.done].filter(Boolean).join(' ')}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseMove={() => !done && i !== current && setActive(i)}
                  onClick={() => !done && submit(l)}
                >
                  <span className={s.meta}>
                    <strong>{l.name}</strong>
                    <span className={s.sub}>
                      {l.country} · {termSpan(l)}
                    </span>
                    {matchedAlias(l, q) && <span className={s.sub}>Also known as {matchedAlias(l, q)}</span>}
                  </span>
                  {done && <span className={s.note}>Already guessed</span>}
                </div>
              );
            })}
            {!q.trim() && <p className={s.more}>Type a few letters: {matches.length.toLocaleString('en-US')} leaders to choose from.</p>}
            {q.trim() && matches.length > LIMIT && <p className={s.more}>Keep typing to narrow the list.</p>}
            {!matches.length && <p className={s.empty}>No leader found. Check the spelling?</p>}
          </div>
        )}
      </div>
      <p role="status" className={s.msg}>
        {msg || help}
      </p>
    </div>
  );
}

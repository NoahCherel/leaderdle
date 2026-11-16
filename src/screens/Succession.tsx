import { useEffect } from 'react';
import { useApp } from '../app/context';
import { usePhone } from '../app/hooks';
import { IconCross } from '../components/icons';
import { LeaderPhoto, prefetchLeaderPhotos } from '../components/LeaderPhoto';
import { NameInput } from '../components/NameInput';
import { ROLE_LABEL } from '../game/compare';
import { shareSuccession } from '../game/share';
import { GameLayout, LeaderCard, Result, ResumedBanner, TitleRow, gameStyles as s, leftLabel } from './GameParts';

export function Succession() {
  const { day, status, byId, search, dispatch, n, fresh, markFresh, frozen, state, scene } = useApp();
  const phone = usePhone();
  const st = status.succession;
  const p = day.puzzle.succession;
  const answer = byId(p.answer);
  const before = byId(p.before);
  const after = byId(p.after);
  useEffect(() => {
    prefetchLeaderPhotos([before, after, answer]);
  }, [before, after, answer]);
  const missed = day.succession.filter((id) => id !== answer.id);
  const flip = st.won && fresh?.mode === 'succession' && fresh.id === answer.id && !frozen && !state.settings.reduce;

  const clues: Array<[string, string]> = [
    ['Years', p.years],
    ['Role', ROLE_LABEL[answer.role][0]],
    ['Continent', answer.continent],
    ['Country', answer.country],
  ];

  const submit = (id: string) => {
    dispatch({ type: 'guess', n, mode: 'succession', id });
    markFresh('succession', id);
  };

  return (
    <GameLayout mode="succession">
      <TitleRow mode="succession" left={leftLabel('succession', st)} />
      {st.done && (
        <Result
          mode="succession"
          won={st.won}
          used={st.used}
          scoreLine={st.won ? `Solved in ${st.used} of 5 ${st.used === 1 ? 'guess' : 'guesses'}` : `Out of guesses. The answer was ${answer.name}.`}
          celebrate={flip}
          grid={[day.succession.map((id) => ({ kind: id === answer.id ? 'g' : 'x' }))]}
          shareText={shareSuccession(n, day.succession, answer.id, st)}
        >
          <LeaderCard leader={answer} />
        </Result>
      )}
      <ResumedBanner mode="succession" />
      <div className={s.chain}>
        <div className={`card ${s.link}`}>
          <span className="eyebrow muted">Before</span>
          <LeaderPhoto leader={before} size="sm" />
          <strong>{before.name}</strong>
          <span>{st.done ? p.beforeYears : ''}</span>
        </div>
        <div aria-live="polite" className={[s.link, s.mystery, st.done && s.solved, st.won && s.mysteryWon, flip && s.flipIn].filter(Boolean).join(' ')}>
          <span className="eyebrow">In between</span>
          {st.done && <LeaderPhoto leader={answer} size="sm" />}
          <strong>{st.done ? answer.name : '?'}</strong>
          <span>{st.done ? p.years : ''}</span>
        </div>
        <div className={`card ${s.link}`}>
          <span className="eyebrow muted">After</span>
          <LeaderPhoto leader={after} size="sm" />
          <strong>{after.name}</strong>
          <span>{st.done ? p.afterYears : ''}</span>
        </div>
      </div>
      {!st.done && (
        <NameInput
          label="Who governed in between?"
          tried={day.succession}
          search={search}
          onSubmit={submit}
          initialQuery={scene.q ?? ''}
          initialOpen={!!scene.open}
          scrollOnFocus={phone}
        />
      )}
      <div className={s.stackMid}>
        <div className={s.stackTight}>
          <strong className="eyebrow muted">Clues</strong>
          <div className={s.clues}>
            {clues.map(([label, value], i) => {
              const shown = st.done || i < missed.length;
              return (
                <div key={label} className={`${s.clue} ${shown ? s.clueOn : ''}`}>
                  <span className="eyebrow">{label}</span>
                  <strong className="num">{shown ? value : `Unlocks after miss ${i + 1}`}</strong>
                </div>
              );
            })}
          </div>
        </div>
        {missed.length > 0 && (
          <div className={s.stackTight}>
            <strong className="eyebrow muted">Not the one</strong>
            <ul className={s.chips}>
              {missed.map((id) => (
                <li key={id} className={s.chip}>
                  <IconCross size={14} />
                  {byId(id).name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </GameLayout>
  );
}

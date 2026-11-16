import { useMemo } from 'react';
import { useApp } from '../app/context';
import { usePhone } from '../app/hooks';
import { ColumnHeads, GuessRow } from '../components/GuessRow';
import { NameInput } from '../components/NameInput';
import { compare } from '../game/compare';
import { initials } from '../game/hint';
import { shareClassic } from '../game/share';
import { GameLayout, HintOffer, HintShown, LeaderCard, Result, ResumedBanner, TitleRow, gameStyles as s, leftLabel, type GridCell } from './GameParts';

/** Misses before the initials hint is offered (PASSATION §5). */
const HINT_AFTER = 5;

export function Classic() {
  const { day, status, byId, search, dispatch, n, fresh, markFresh, scene } = useApp();
  const phone = usePhone();
  const st = status.classic;
  const answer = byId(day.puzzle.classic.answer);
  const today = useMemo(() => new Date(), []);

  const played = useMemo(
    () => day.classic.map((id) => ({ leader: byId(id), tiles: compare(byId(id), answer, today) })),
    [day.classic, byId, answer, today],
  );
  const misses = day.classic.filter((id) => id !== answer.id).length;
  const lastId = day.classic[day.classic.length - 1];
  const freshId = fresh?.mode === 'classic' ? fresh.id : null;

  const grid: GridCell[][] = played.map((r) =>
    r.tiles.map((t) => ({
      kind: t.state === 'correct' ? 'g' : t.state === 'close' ? 'y' : 'x',
      arrow: t.state === 'miss' ? (t.dir === 'up' ? '↑' : t.dir === 'down' ? '↓' : undefined) : undefined,
    })),
  );

  const submit = (id: string) => {
    dispatch({ type: 'guess', n, mode: 'classic', id });
    markFresh('classic', id);
  };

  return (
    <GameLayout mode="classic">
      <TitleRow mode="classic" left={leftLabel('classic', st)} />
      {st.done && (
        <Result
          mode="classic"
          won={st.won}
          used={st.used}
          scoreLine={st.won ? `Solved in ${st.used} of 8 ${st.used === 1 ? 'guess' : 'guesses'}` : `Out of guesses. The answer was ${answer.name}.`}
          celebrate={st.won && freshId === lastId}
          grid={grid}
          shareText={shareClassic(n, played.map((r) => r.tiles), st, day.hint)}
          hint={day.hint}
        >
          <LeaderCard leader={answer} />
        </Result>
      )}
      <ResumedBanner mode="classic" />
      {!st.done && (
        <NameInput
          label="Who is today’s leader?"
          tried={day.classic}
          search={search}
          onSubmit={submit}
          initialQuery={scene.q ?? ''}
          initialOpen={!!scene.open}
          scrollOnFocus={phone}
        />
      )}
      {!st.done && !day.hint && misses >= HINT_AFTER && <HintOffer onReveal={() => dispatch({ type: 'hint', n })} />}
      {!st.done && day.hint && <HintShown initials={initials(answer.name)} />}
      <div className={s.stack}>
        {played.length > 0 ? (
          <>
            <ColumnHeads />
            {played
              .map((r, i) => (
                <GuessRow key={r.leader.id} leader={r.leader} tiles={r.tiles} animate={freshId === r.leader.id && i === played.length - 1} />
              ))
              .reverse()}
            <p className={s.closeNote}>Close (~): same continent, shared role, or within 10 yrs · 2 yrs · 5 yrs.</p>
          </>
        ) : (
          <div className={s.empty}>
            <strong>Your guesses will show up here</strong>
            <span className="muted">Start with any leader you know. Every guess gives you five clues.</span>
          </div>
        )}
      </div>
    </GameLayout>
  );
}

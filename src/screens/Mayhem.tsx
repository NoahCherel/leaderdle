import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { useApp } from '../app/context';
import { useShare } from '../app/hooks';
import { Flag } from '../components/Chrome';
import { IconCheck, IconCross, IconShare } from '../components/icons';
import type { MayhemResult } from '../data/loader';
import {
  OUTCOME_TEXT,
  PORTFOLIOS,
  PORTFOLIO_NAMES,
  PORTFOLIO_SHORT,
  ROUNDS,
  newRun,
  offered,
  pick,
  playNext,
  reroll,
  rerollTargets,
  runOutcome,
  shownYear,
  teamTotal,
  type Match,
  type MayhemData,
  type MayhemRun,
  type Outcome,
} from '../game/mayhem';
import { shareMayhem } from '../game/share';
import { GameLayout, gameStyles as s } from './GameParts';

/** Time between two duels being shown. */
const DUEL_MS = 650;
const STAMP: Record<Outcome, string> = { champion: 'Champion', final: 'Runner-up', semi: 'Knocked out', quarter: 'Knocked out' };
const yy = (year: number | null) => (year === null ? '' : `'${String(year).slice(-2)}`);

/** `?seed=` fixes the draws (tests, or two friends comparing). Each new run moves on from it. */
function nextSeed(played: number): number {
  const forced = Number(new URLSearchParams(window.location.search).get('seed'));
  return Number.isInteger(forced) && forced > 0 ? forced + played : Math.floor(Math.random() * 2 ** 31) + 1;
}

export function Mayhem() {
  const { loadMayhemData } = useApp();
  const [load, setLoad] = useState<'loading' | MayhemResult>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let on = true;
    setLoad('loading');
    void loadMayhemData().then((r) => on && setLoad(r));
    return () => {
      on = false;
    };
  }, [loadMayhemData, attempt]);

  return (
    <GameLayout mode="mayhem">
      <div className={s.titleRow}>
        <h1 className={`title ${s.h1}`}>Leader Mayhem</h1>
        <span className={s.left}>Bonus</span>
      </div>
      {load === 'loading' ? (
        <p role="status" className="muted">
          Loading…
        </p>
      ) : load.ok ? (
        <Game data={load.data} />
      ) : (
        <div className={`card ${s.hintOffer}`}>
          <span>
            <strong>The ratings could not be loaded.</strong> {load.kind === 'offline' ? 'Check your connection.' : 'Please come back a little later.'} Your daily games are not affected.
          </span>
          <button type="button" className="btn" onClick={() => setAttempt((a) => a + 1)}>
            Try again
          </button>
        </div>
      )}
    </GameLayout>
  );
}

function Game({ data }: { data: MayhemData }) {
  const { state, dispatch, byId, frozen } = useApp();
  const share = useShare();
  const run = state.mayhem.run;
  const stats = state.mayhem.stats;
  const still = frozen || state.settings.reduce || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const save = useCallback(
    (next: MayhemRun | null) => dispatch({ type: 'mayhem', run: next, total: next?.done ? teamTotal(next.team as string[], data.ratings) : undefined }),
    [dispatch, data.ratings],
  );
  const start = () => save(newRun(nextSeed(stats.played), data));

  // Draft: the leader chosen in the draw, waiting for a portfolio.
  const [chosen, setChosen] = useState<string | null>(null);
  useEffect(() => setChosen(null), [run?.cell?.country, run?.cell?.decade, run?.seed]);

  // Tournament: duels of the match played in this session show one by one.
  const [live, setLive] = useState<{ index: number; shown: number } | null>(null);
  const timer = useRef<number>();
  useEffect(() => () => window.clearInterval(timer.current), []);
  const play = () => {
    if (!run) return;
    const next = playNext(run, data);
    if (next === run) return;
    save(next);
    if (still) return;
    setLive({ index: next.matches.length - 1, shown: 0 });
    window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setLive((l) => {
        if (!l || l.shown >= PORTFOLIOS.length) {
          window.clearInterval(timer.current);
          return null;
        }
        return { ...l, shown: l.shown + 1 };
      });
    }, DUEL_MS);
  };

  if (!run) {
    return (
      <>
        <div className={s.mIntro}>
          <p>
            Form a government of five leaders, one for each portfolio: Education, War, Economy, Domestic and Foreign. Each round draws a decade and a country, and you choose among the leaders in office then.
          </p>
          <p>Your government then plays a quarter-final, a semi-final and a final against rival governments, portfolio against portfolio. Play as often as you like.</p>
          <p className={s.mNote}>
            Every leader has a hidden rating from 1 to 10 in each portfolio. These ratings are <strong>our own judgement</strong> of the weight a leader carried in that field, whatever their aims. They are not facts and not a moral verdict.{' '}
            <Link href="/how-we-pick">How we rate</Link>
          </p>
        </div>
        <button type="button" className="btn btn--lg" style={{ alignSelf: 'flex-start' }} onClick={start}>
          Form a government
        </button>
        <StatsLine stats={stats} />
      </>
    );
  }

  const filled = run.team.filter(Boolean).length;
  const drafting = filled < PORTFOLIOS.length;
  const revealing = live !== null;
  const ended = run.done && !revealing;
  const outcome = runOutcome(run);
  const options = offered(run, data);
  const sample = options[0] ? byId(options[0]) : null;

  return (
    <>
      {ended && (
        <section aria-label="Result" className={s.hero}>
          <span className={`stamp ${outcome === 'champion' || outcome === 'final' ? '' : s.stampLost}`}>{STAMP[outcome]}</span>
          <h2 className="title">{OUTCOME_TEXT[outcome]}</h2>
          <p className={s.score}>Team total {teamTotal(run.team as string[], data.ratings)}/50</p>
        </section>
      )}

      {drafting && run.cell && (
        <>
          <p className={s.brief}>
            <strong>Pick {filled + 1} of 5.</strong> Choose a leader from the draw, then the portfolio to give them. Ratings stay hidden until the end.
          </p>
          <section aria-label="The draw" className={`card ${s.draw}`}>
            <div key={`${run.cell.decade}-${run.cell.country}`} className={still ? s.drawIn : `${s.drawIn} ${s.drawFlip}`}>
              <span className="eyebrow muted">The draw</span>
              <strong className={`title ${s.drawDecade}`}>
                {run.cell.decade}
                <span className={s.drawS}>s</span>
              </strong>
              <span className={s.drawCountry}>
                {sample && <Flag iso2={sample.iso2} country={sample.country} code={sample.countryCode} />}
                <strong className="title">{run.cell.country}</strong>
              </span>
            </div>
            <div className={s.rerolls}>
              {(['country', 'decade'] as const).map((kind) => {
                const spent = run.rerolls[kind];
                const possible = rerollTargets(run, kind, data).length > 0;
                return (
                  <button
                    key={kind}
                    type="button"
                    className="btn btn--outline"
                    disabled={!possible}
                    title={spent ? 'Already used' : possible ? 'One use per government' : `No other ${kind} to draw`}
                    onClick={() => save(reroll(run, kind, data))}
                  >
                    Another {kind}
                  </button>
                );
              })}
              <span className={s.rerollNote}>One of each per government.</span>
            </div>
          </section>
          <div role="group" aria-label="Leaders in office" className={s.offer}>
            {options.map((id) => {
              const l = byId(id);
              return (
                <button key={id} type="button" aria-pressed={chosen === id} className={`${s.offerBtn} ${chosen === id ? s.offerOn : ''}`} onClick={() => setChosen(chosen === id ? null : id)}>
                  <strong>{l.name}</strong>
                  <span className="num">{yy(shownYear(l, run.cell!.decade))}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className={s.stack} style={{ gap: 8 }}>
        <strong className="eyebrow muted">Your government</strong>
        <ol aria-label="Your government" className={s.sheet}>
          {PORTFOLIOS.map((p, i) => {
            const id = run.team[i];
            const pickable = drafting && !id && chosen !== null;
            return (
              <li key={p} className={`${s.slot} ${id ? s.slotOn : ''}`}>
                <span className={`eyebrow ${s.slotName}`}>{PORTFOLIO_NAMES[p]}</span>
                {id ? (
                  <span className={s.slotWho}>
                    <strong>{byId(id).name}</strong> <span className="num muted">{yy(run.years[i] ?? null)}</span>
                  </span>
                ) : pickable ? (
                  <button type="button" className={`btn ${s.slotBtn}`} onClick={() => save(pick(run, chosen!, i, data))}>
                    Give {PORTFOLIO_NAMES[p]} to {byId(chosen!).name}
                  </button>
                ) : (
                  <span className="muted">{drafting ? 'Empty' : ''}</span>
                )}
                {ended && id && (
                  <span className={`num ${s.slotRating}`} aria-label={`${PORTFOLIO_NAMES[p]} rating ${data.ratings[id]?.[i]} out of 10`}>
                    {data.ratings[id]?.[i]}
                    <small>/10</small>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {run.matches.map((m, i) => (
        <MatchCard key={i} title={ROUNDS[i]!} match={m} team={run.team as string[]} shown={live?.index === i ? live.shown : PORTFOLIOS.length} />
      ))}

      {!drafting && !run.done && !revealing && (
        <button type="button" className="btn btn--lg" onClick={play}>
          Play the {ROUNDS[run.matches.length]!.toLowerCase()}
        </button>
      )}

      {ended && (
        <>
          <div className={s.mEnd}>
            <button
              type="button"
              className="btn btn--lg"
              onClick={() => share(shareMayhem(outcome, run.team.map((id, i) => ({ name: byId(id!).name, year: run.years[i] ?? 0 }))))}
            >
              <IconShare size={22} />
              Share result
            </button>
            <button type="button" className="btn btn--md btn--outline" onClick={start}>
              Form a new government
            </button>
          </div>
          <StatsLine stats={stats} />
        </>
      )}
    </>
  );
}

function MatchCard({ title, match, team, shown }: { title: string; match: Match; team: string[]; shown: number }) {
  const { byId } = useApp();
  const complete = shown >= PORTFOLIOS.length;
  const wins = match.duels.filter(Boolean).length;
  return (
    <section aria-label={title} className={`card ${s.match}`}>
      <div className={s.matchHead}>
        <h2 className="title">{title}</h2>
        <strong aria-live="polite" className={`eyebrow ${complete ? (match.won ? s.matchWon : s.matchLost) : 'muted'}`}>
          {complete ? `${match.won ? 'Won' : 'Lost'} ${wins}–${PORTFOLIOS.length - wins}` : 'In play…'}
        </strong>
      </div>
      <ol className={s.duels}>
        {PORTFOLIOS.map((p, i) => {
          const seen = i < shown;
          const won = match.duels[i]!;
          return (
            <li key={p} className={`${s.duel} ${seen ? (won ? s.duelWon : s.duelLost) : ''}`}>
              <span className={`eyebrow ${s.duelName}`}>{PORTFOLIO_SHORT[p]}</span>
              <span className={s.duelMine}>{byId(team[i]!).name}</span>
              <span className={s.duelMark}>
                {seen ? won ? <IconCheck size={16} /> : <IconCross size={14} /> : null}
                <span className="sr-only">{seen ? (won ? 'beats' : 'loses to') : 'against'}</span>
              </span>
              <span className={s.duelTheirs}>{byId(match.opponent[i]!).name}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StatsLine({ stats }: { stats: { played: number; titles: number; best: number } }) {
  if (!stats.played) return null;
  return (
    <p className="eyebrow muted">
      {stats.played} played · {stats.titles} {stats.titles === 1 ? 'title' : 'titles'} · best total {stats.best}/50
    </p>
  );
}

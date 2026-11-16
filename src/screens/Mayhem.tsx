import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { useApp } from '../app/context';
import { useShare } from '../app/hooks';
import { Flag } from '../components/Chrome';
import { IconCheck, IconCross, IconShare } from '../components/icons';
import { LeaderPhoto, prefetchLeaderPhotos } from '../components/LeaderPhoto';
import type { MayhemResult } from '../data/loader';
import { ROLE_LABEL } from '../game/compare';
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
  resumable,
  reroll,
  rerollTargets,
  runOutcome,
  shownYear,
  type Match,
  type MayhemData,
  type MayhemRun,
  type Outcome,
  type Ratings,
} from '../game/mayhem';
import { buildDuelStory, rivalCoalitionName } from '../game/mayhem-actions';
import { shareMayhem } from '../game/share';
import { GameLayout, gameStyles as s } from './GameParts';

/** Duration (ms) of each of the 4 steps inside a duel at 1x speed (~3.1s per duel). */
const STEP_MS: readonly [number, number, number, number] = [650, 800, 850, 850];
const STAMP: Record<Outcome, string> = { champion: 'Champion', final: 'Runner-up', semi: 'Knocked out', quarter: 'Knocked out' };

/** Under the result: how close the last match was. */
function scoreLine(run: MayhemRun): string {
  if (runOutcome(run) === 'champion') return 'Three matches, three wins.';
  const last = run.matches[run.matches.length - 1]!;
  const wins = last.duels.filter(Boolean).length;
  return `${wins} of ${PORTFOLIOS.length} duels won in the ${ROUNDS[run.matches.length - 1]!.toLowerCase()}.`;
}
const yy = (year: number | null) => (year === null ? '' : `'${String(year).slice(-2)}`);

/** `?seed=` fixes the draws (tests, or two friends comparing). Each new run moves on from it. */
function nextSeed(played: number): number {
  const forced = Number(new URLSearchParams(window.location.search).get('seed'));
  return Number.isInteger(forced) && forced > 0 ? forced + played : Math.floor(Math.random() * 2 ** 31) + 1;
}

export interface LiveDuelState {
  /** Match index (0 = Quarter, 1 = Semi, 2 = Final). */
  index: number;
  /** Duel index (0..4, corresponding to PORTFOLIOS). */
  duel: number;
  /**
   * 0 = Face-off & Crisis reveal
   * 1 = Player minister's action
   * 2 = Rival minister's counter-action & suspense bar oscillation
   * 3 = Verdict stamp & climax
   */
  phase: 0 | 1 | 2 | 3;
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
            <strong>Leader Mayhem could not be loaded.</strong> {load.kind === 'offline' ? 'Check your connection.' : 'Please come back a little later.'} Your daily games are not affected.
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
    (next: MayhemRun | null) => dispatch({ type: 'mayhem', run: next }),
    [dispatch],
  );
  const start = () => {
    setLive(null);
    save(newRun(nextSeed(stats.played), data));
  };

  // Draft: the leader chosen in the draw, waiting for a portfolio.
  const [chosen, setChosen] = useState<string | null>(null);
  const offerRef = useRef<HTMLDivElement>(null);
  const placed = useRef(false);
  useEffect(() => {
    if (!placed.current) return;
    placed.current = false;
    offerRef.current?.querySelector('button')?.focus();
  }, [run?.draws]);
  useEffect(() => setChosen(null), [run?.cell?.country, run?.cell?.decade, run?.seed]);

  // Tournament: step-by-step live duel arena.
  const [live, setLive] = useState<LiveDuelState | null>(null);
  const [fast, setFast] = useState(false);
  useEffect(() => {
    if (!live) return;
    const delay = Math.round(STEP_MS[live.phase] / (fast ? 2 : 1));
    const id = window.setTimeout(() => {
      setLive((cur) => {
        if (!cur) return null;
        if (cur.phase < 3) return { ...cur, phase: (cur.phase + 1) as 0 | 1 | 2 | 3 };
        if (cur.duel + 1 < PORTFOLIOS.length) return { ...cur, duel: cur.duel + 1, phase: 0 };
        return null;
      });
    }, delay);
    return () => window.clearTimeout(id);
  }, [live, fast]);

  const validRun = !!run && resumable(run, data);
  const options = validRun ? offered(run, data) : [];
  useEffect(() => {
    if (!run || !validRun) return;
    const ids = [
      ...offered(run, data),
      ...run.team.filter((id): id is string => id !== null),
      ...run.matches.flatMap((m) => m.opponent),
    ];
    prefetchLeaderPhotos(ids.map((id) => byId(id)));
  }, [run?.seed, run?.draws, run?.matches.length, validRun, data, byId]);

  const play = () => {
    if (!run) return;
    const next = playNext(run, data);
    if (next === run) return;
    save(next);
    if (still) return;
    setLive({ index: next.matches.length - 1, duel: 0, phase: 0 });
  };

  const stepForward = () => {
    setLive((cur) => {
      if (!cur) return null;
      if (cur.phase < 3) return { ...cur, phase: 3 };
      if (cur.duel + 1 < PORTFOLIOS.length) return { ...cur, duel: cur.duel + 1, phase: 0 };
      return null;
    });
  };

  if (run && !resumable(run, data)) {
    return (
      <>
        <p className={s.mNote}>Our list of leaders was updated since this government was formed, so it cannot go on. Start a new one: it only takes a minute.</p>
        <button type="button" className={`btn btn--lg ${s.mStartBtn}`} onClick={start}>
          Form a new government
        </button>
      </>
    );
  }

  if (!run) {
    return (
      <>
        <div className={s.mIntro}>
          <p>
            Form a government of five leaders, one for each portfolio: Education, War, Economy, Domestic and Foreign. Each round draws a decade and a country, and you choose among the leaders in office then.
          </p>
          <p>Your government then plays a quarter-final, a semi-final and a final against rival governments, portfolio against portfolio. Play as often as you like.</p>
          <p className={s.mNote}>
            A duel goes to the leader who weighed more in that field, as we judge it, with a share of luck. Our judgement looks at what leaders achieved, whatever their aims: it is an opinion, not a fact, and not a moral verdict.{' '}
            <Link href="/how-we-pick">How we pick</Link>
          </p>
        </div>
        <button type="button" className={`btn btn--lg ${s.mStartBtn}`} onClick={start}>
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
  const sample = options[0] ? byId(options[0]) : null;

  return (
    <>
      {ended && (
        <section aria-label="Result" className={s.hero}>
          <span className={`stamp ${outcome === 'champion' || outcome === 'final' ? '' : s.stampLost}`}>{STAMP[outcome]}</span>
          <h2 className="title">{OUTCOME_TEXT[outcome]}</h2>
          <p className={s.score}>{scoreLine(run)}</p>
        </section>
      )}

      {drafting && run.cell && (
        <>
          <p className={s.brief}>
            <strong>Pick {filled + 1} of 5.</strong> Choose a leader from the draw, then the portfolio to give them.
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
                    {!possible && <span className="sr-only">{spent ? ', already used' : `, no other ${kind} to draw`}</span>}
                  </button>
                );
              })}
              <span className={s.rerollNote}>One of each per government.</span>
            </div>
          </section>
          <div ref={offerRef} role="group" aria-label="Leaders in office" className={s.offer}>
            {options.map((id) => {
              const l = byId(id);
              return (
                <button key={id} type="button" aria-pressed={chosen === id} className={`${s.offerBtn} ${chosen === id ? s.offerOn : ''}`} onClick={() => setChosen(chosen === id ? null : id)}>
                  <LeaderPhoto leader={l} size="md" />
                  <span className={s.offerMeta}>
                    <strong>{l.name}</strong>
                    <span className={s.offerRole}>{ROLE_LABEL[l.role][0]}</span>
                  </span>
                  <span className={`num ${s.offerYear}`}>{yy(shownYear(l, run.cell!.decade))}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className={s.stackTight}>
        <div className={s.sheetHead}>
          <strong className="eyebrow muted">Your government</strong>
          <span className="eyebrow muted">{drafting ? `${filled} of 5 seated` : 'Cabinet complete'}</span>
        </div>
        <ol aria-label="Your government" className={s.sheet}>
          {PORTFOLIOS.map((p, i) => {
            const id = run.team[i];
            const pickable = drafting && !id && chosen !== null;
            const seated = id ? byId(id) : null;
            return (
              <li key={p} className={`${s.slot} ${id ? s.slotOn : ''}`}>
                <span className={`eyebrow ${s.slotName}`}>{PORTFOLIO_NAMES[p]}</span>
                {seated ? (
                  <span className={s.slotWho}>
                    <LeaderPhoto leader={seated} size="xs" />
                    <strong>{seated.name}</strong> <span className="num muted">{yy(run.years[i] ?? null)}</span>
                  </span>
                ) : pickable ? (
                  <button
                    type="button"
                    className={`btn btn--outline ${s.slotBtn}`}
                    onClick={() => {
                      placed.current = true;
                      save(pick(run, chosen!, i, data));
                    }}
                  >
                    Give {PORTFOLIO_NAMES[p]} to {byId(chosen!).name}
                  </button>
                ) : (
                  <span className="muted">{drafting ? 'Empty' : ''}</span>
                )}
              </li>
            );
          })}
        </ol>
        {filled > 0 && !ended && !revealing && (
          <button type="button" className={`link-btn ${s.mStartBtn}`} onClick={start}>
            Start over
          </button>
        )}
      </div>

      {!drafting && (
        <div aria-label="Tournament stages" className={s.stages}>
          {ROUNDS.map((r, i) => {
            const m = run.matches[i];
            const isLive = live?.index === i;
            const done = !!m && !isLive;
            const current = isLive || (!m && !run.done && i === run.matches.length);
            const cls = [s.stage, done && (m.won ? s.stageWon : s.stageLost), current && s.stageCurrent].filter(Boolean).join(' ');
            return (
              <div key={r} className={cls}>
                <span className="eyebrow">0{i + 1}</span>
                <strong>{r}</strong>
              </div>
            );
          })}
        </div>
      )}

      {run.matches.map((m, i) => (
        <MatchCard
          key={i}
          roundIndex={i}
          isLatest={i === run.matches.length - 1}
          seed={run.seed}
          title={ROUNDS[i]!}
          match={m}
          team={run.team as string[]}
          years={run.years}
          live={live?.index === i ? live : null}
          fast={fast}
          onToggleFast={() => setFast((f) => !f)}
          onStep={stepForward}
          onSkip={() => setLive(null)}
          ratings={data.ratings}
        />
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

interface MatchCardProps {
  roundIndex: number;
  isLatest: boolean;
  seed: number;
  title: string;
  match: Match;
  team: string[];
  years: Array<number | null>;
  live: LiveDuelState | null;
  fast: boolean;
  onToggleFast: () => void;
  onStep: () => void;
  onSkip: () => void;
  ratings: Ratings;
}

function MatchCard({
  roundIndex,
  isLatest,
  seed,
  title,
  match,
  team,
  years,
  live,
  fast,
  onToggleFast,
  onStep,
  onSkip,
  ratings,
}: MatchCardProps) {
  const { byId } = useApp();
  const [inspected, setInspected] = useState<number | null>(isLatest ? 0 : null);

  useEffect(() => {
    if (live) setInspected(live.duel);
  }, [live?.duel]);

  useEffect(() => {
    if (!isLatest && !live) setInspected(null);
  }, [isLatest, live]);

  const shown = live ? live.duel + (live.phase >= 3 ? 1 : 0) : PORTFOLIOS.length;
  const complete = !live && shown >= PORTFOLIOS.length;
  const wins = match.duels.filter(Boolean).length;
  const seenWins = match.duels.slice(0, shown).filter(Boolean).length;
  const rivalName = rivalCoalitionName(seed, roundIndex);

  const showArena = live !== null || inspected !== null;
  const activeDuel = live ? live.duel : (inspected ?? 0);
  const activePhase: 0 | 1 | 2 | 3 = live ? live.phase : 3;
  const myLeader = byId(team[activeDuel]!);
  const theirLeader = byId(match.opponent[activeDuel]!);
  const myW = ratings[team[activeDuel]!]?.[activeDuel] ?? 5;
  const theirW = ratings[match.opponent[activeDuel]!]?.[activeDuel] ?? 5;
  const duelWon = match.duels[activeDuel]!;
  const story = buildDuelStory(seed, roundIndex, activeDuel, myLeader, theirLeader, myW, theirW, duelWon);
  const isDecider = activeDuel === 4 && match.duels.slice(0, 4).filter(Boolean).length === 2;

  const tugPercent =
    activePhase === 0
      ? 50
      : activePhase === 1
        ? 66
        : activePhase === 2
          ? 44
          : duelWon
            ? 88
            : 12;

  return (
    <section aria-label={title} className={`card ${s.match}`}>
      <div className={s.matchHead}>
        <div className={s.matchTitleGroup}>
          <h2 className="title">{title}</h2>
          <span className="eyebrow muted">vs. {rivalName}</span>
        </div>
        <strong aria-live="polite" className={`eyebrow ${complete ? (match.won ? s.matchWon : s.matchLost) : 'muted'}`}>
          {complete ? `${match.won ? 'Won' : 'Lost'} ${wins}–${PORTFOLIOS.length - wins}` : shown > 0 ? `In play · ${seenWins}–${shown - seenWins}` : 'In play…'}
        </strong>
      </div>

      {showArena && (
        <div className={s.arena}>
          <div className={s.arenaBar}>
            <span className={`eyebrow ${s.arenaTag}`}>
              Duel {activeDuel + 1} of {PORTFOLIOS.length} · {PORTFOLIO_NAMES[PORTFOLIOS[activeDuel]!]}
              {isDecider && <span className={s.deciderBadge}>Decider</span>}
            </span>
            {live ? (
              <div className={s.arenaControls}>
                <button type="button" className={s.ctrlBtn} onClick={onToggleFast} aria-pressed={fast}>
                  {fast ? '2×' : '1×'}
                </button>
                <button type="button" className={s.ctrlBtn} onClick={onStep}>
                  {live.phase < 3 ? 'Reveal' : 'Next'}
                </button>
                <button type="button" className={s.ctrlBtn} onClick={onSkip}>
                  Skip
                </button>
              </div>
            ) : (
              <span className="eyebrow muted">Click any duel below to inspect</span>
            )}
          </div>

          <div className={s.crisisBanner} key={`crisis-${activeDuel}`}>
            <span className="eyebrow muted">Crisis brief</span>
            <strong>{story.crisis}</strong>
          </div>

          <div className={s.faceoff} key={`faceoff-${activeDuel}`}>
            <div
              className={[
                s.fighter,
                s.fighterMine,
                activePhase >= 1 && s.fighterActive,
                activePhase === 3 && (duelWon ? s.fighterWon : s.fighterLost),
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="eyebrow muted">Your Minister</span>
              <div className={s.fighterPortraitRow}>
                <LeaderPhoto leader={myLeader} size="lg" />
                <Flag iso2={myLeader.iso2} country={myLeader.country} code={myLeader.countryCode} />
              </div>
              <strong className={`title ${s.fighterName}`}>{myLeader.name}</strong>
              <span className={`muted ${s.fighterMeta}`}>
                {myLeader.country} {years[activeDuel] ? `· ${yy(years[activeDuel]!)}` : ''}
              </span>
            </div>

            <div className={s.vsCol}>
              <span className={`title ${s.vsBadge}`}>VS</span>
              {activePhase === 3 && (
                <span className={`${s.duelStamp} ${duelWon ? s.duelStampWon : s.duelStampLost}`}>
                  {duelWon ? 'Won' : 'Lost'}
                </span>
              )}
            </div>

            <div
              className={[
                s.fighter,
                s.fighterTheirs,
                activePhase >= 2 && s.fighterActive,
                activePhase === 3 && (!duelWon ? s.fighterWon : s.fighterLost),
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="eyebrow muted">Rival Minister</span>
              <div className={s.fighterPortraitRow}>
                <LeaderPhoto leader={theirLeader} size="lg" />
                <Flag iso2={theirLeader.iso2} country={theirLeader.country} code={theirLeader.countryCode} />
              </div>
              <strong className={`title ${s.fighterName}`}>{theirLeader.name}</strong>
              <span className={`muted ${s.fighterMeta}`}>
                {theirLeader.country} · {yy(theirLeader.tookOffice)}
              </span>
            </div>
          </div>

          <div className={s.tugWrap} aria-hidden="true">
            <div className={`${s.tugTrack} ${activePhase === 2 ? s.tugOscillate : ''}`}>
              <div
                className={`${s.tugFill} ${activePhase === 3 ? (duelWon ? s.tugFillWon : s.tugFillLost) : ''}`}
                style={{ width: `${tugPercent}%` }}
              />
            </div>
          </div>

          <div className={s.actionsFeed}>
            <div className={`${s.actionCard} ${activePhase >= 1 ? s.actionVisible : s.actionPending}`}>
              <span className="eyebrow muted">{myLeader.name}</span>
              <p>{activePhase >= 1 ? story.myAction : 'Preparing ministry response…'}</p>
            </div>
            <div className={`${s.actionCard} ${s.actionCardTheirs} ${activePhase >= 2 ? s.actionVisible : s.actionPending}`}>
              <span className="eyebrow muted">{theirLeader.name}</span>
              <p>{activePhase >= 2 ? story.theirAction : 'Awaiting counter-move…'}</p>
            </div>
          </div>

          {activePhase === 3 && (
            <div className={`${s.climaxBar} ${duelWon ? s.climaxWon : s.climaxLost}`}>
              {story.upset && <span className={`eyebrow ${s.upset}`}>Upset</span>}
              <span>{story.climax}</span>
            </div>
          )}
        </div>
      )}

      <ol className={s.duels}>
        {PORTFOLIOS.map((p, i) => {
          const seen = i < shown;
          const isCurrent = live ? live.duel === i : inspected === i;
          const won = match.duels[i]!;
          const mLeader = byId(team[i]!);
          const tLeader = byId(match.opponent[i]!);
          const mW = ratings[team[i]!]?.[i] ?? 0;
          const tW = ratings[match.opponent[i]!]?.[i] ?? 0;
          const upset = seen && ((won && mW < tW) || (!won && tW < mW));
          return (
            <li
              key={p}
              className={[
                s.duel,
                seen && (won ? s.duelWon : s.duelLost),
                isCurrent && s.duelActive,
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => !live && setInspected(inspected === i && !isLatest ? null : i)}
            >
              <span className={`eyebrow ${s.duelName}`}>{PORTFOLIO_SHORT[p]}</span>
              <span className={s.duelMine}>
                <LeaderPhoto leader={mLeader} size="xs" />
                <span>
                  {mLeader.name}
                  {upset && won && <span className={`eyebrow ${s.upset}`}>Upset</span>}
                </span>
              </span>
              <span className={s.duelMark}>
                {seen ? won ? <IconCheck size={16} /> : <IconCross size={14} /> : null}
                <span className="sr-only">{seen ? (won ? `beats${upset ? ', upset,' : ''}` : `loses to${upset ? ', upset,' : ''}`) : 'against'}</span>
              </span>
              <span className={s.duelTheirs}>
                <span>
                  {upset && !won && <span className={`eyebrow ${s.upset}`}>Upset</span>}
                  {tLeader.name}
                </span>
                <LeaderPhoto leader={tLeader} size="xs" />
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StatsLine({ stats }: { stats: { played: number; titles: number } }) {
  if (!stats.played) return null;
  return (
    <p className="eyebrow muted">
      {stats.played} played · {stats.titles} {stats.titles === 1 ? 'title' : 'titles'}
    </p>
  );
}

import { useEffect, type ReactNode } from 'react';
import { Link } from 'wouter';
import { useApp } from '../app/context';
import { useCountdown, useShare } from '../app/hooks';
import { AdSlot, Flag, ModePills } from '../components/Chrome';
import { IconBulb, IconShare } from '../components/icons';
import { ROLE_LABEL } from '../game/compare';
import { score } from '../game/share';
import { currentStreak } from '../game/stats';
import { isInOffice, termSpan, yearsInOffice } from '../game/tenure';
import { MAX, MODE_NAMES, MODES, type Leader, type Mode, type Topic } from '../game/types';
import s from './game.module.css';

/** Two columns on desktop (game + 300 × 600 ad), one column below 1000 px. */
export function GameLayout({ mode, children }: { mode: Topic; children: ReactNode }) {
  const { state, dispatch, openModal, frozen } = useApp();
  // The rules open by themselves on the very first game only: each game states its own rule on the page.
  // Classic is the exception, its tile colors need the legend, so it always opens once.
  // Leader Mayhem explains itself on its opening page.
  const seen = mode === 'mayhem' || (mode === 'classic' ? !!state.helpSeen.classic : Object.keys(state.helpSeen).length > 0);
  useEffect(() => {
    if (seen || frozen) return;
    dispatch({ type: 'helpSeen', mode });
    openModal('help', mode);
  }, [mode, seen, frozen, dispatch, openModal]);

  return (
    <div className={s.layout}>
      <main className={s.main}>
        <ModePills current={mode} />
        {children}
      </main>
      <div className={s.rail}>
        <AdSlot kind="rail" />
      </div>
    </div>
  );
}

export function TitleRow({ mode, left }: { mode: Mode; left: string }) {
  const { n } = useApp();
  return (
    <div className={s.titleRow}>
      <h1 className={`title ${s.h1}`}>
        {MODE_NAMES[mode]} <span className={s.no}>#{n}</span>
      </h1>
      <span aria-live="polite" className={s.left}>
        {left}
      </span>
    </div>
  );
}

export function leftLabel(mode: Mode, st: { won: boolean; lost: boolean; used: number }): string {
  const unit = mode === 'timeline' ? ['check', 'checks'] : ['guess', 'guesses'];
  if (st.won) return `Solved ${st.used}/${MAX[mode]}`;
  if (st.lost) return `No ${unit[1]} left`;
  const left = MAX[mode] - st.used;
  return `${left} ${left === 1 ? unit[0] : unit[1]} left`;
}

export function ResumedBanner({ mode }: { mode: Mode }) {
  const { resumed, status, scene } = useApp();
  const st = status[mode];
  if (!(resumed || scene.banner) || st.done || st.used === 0) return null;
  return (
    <p role="status" className={s.banner}>
      Welcome back! Your game is right where you left it.
    </p>
  );
}

/** The word on the result stamp: how well it went, not only that it ended. */
export function verdict(mode: Mode, won: boolean, used: number): string {
  if (!won) return 'Missed';
  if (used === 1) return 'First try';
  if (used === MAX[mode]) return 'Just in time';
  return used <= Math.ceil(MAX[mode] / 3) ? 'Brilliant' : 'Solved';
}

export function inOfficeLine(l: Leader, today: Date): string {
  const years = yearsInOffice(l, today);
  const span = l.terms?.length ? termSpan(l) : `from ${l.tookOffice}`;
  return `${span} · ${years} ${years === 1 ? 'year' : 'years'}`;
}

export function blurb(l: Leader): string {
  if (l.blurb) return l.blurb;
  const role = ROLE_LABEL[l.role][0] === 'Both' ? 'Head of state and government' : ROLE_LABEL[l.role][0];
  if (!l.terms?.length) return `${role} of ${l.country} from ${l.tookOffice}.`;
  const span = termSpan(l);
  return isInOffice(l) ? `${role} of ${l.country} since ${l.tookOffice}.` : `${role} of ${l.country} from ${span.replace(' – ', ' to ')}.`;
}

const wiki = (l: Leader) => l.wiki ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(l.name.replace(/ /g, '_'))}`;
const reportHref = (name: string) => `/report?leader=${encodeURIComponent(name)}`;

/** Factual leader card shown at the end of Classic and Succession (PASSATION §6). */
export function LeaderCard({ leader }: { leader: Leader }) {
  const today = new Date();
  return (
    <section aria-label="Today's leader" className={`card ${s.leader}`}>
      <span className="eyebrow muted">File · today's leader</span>
      <div className={s.leaderHead}>
        <Flag iso2={leader.iso2} country={leader.country} code={leader.countryCode} />
        <h3 className="title">{leader.name}</h3>
      </div>
      <dl className={s.facts}>
        <dt>Country</dt>
        <dd>{leader.country}</dd>
        <dt>Role</dt>
        <dd>{ROLE_LABEL[leader.role][0]}</dd>
        <dt>In office</dt>
        <dd>{inOfficeLine(leader, today)}</dd>
        <dt>Age at start</dt>
        <dd>{leader.ageAtStart}</dd>
      </dl>
      <p>{blurb(leader)}</p>
      <div className={s.leaderLinks}>
        <a href={wiki(leader)} target="_blank" rel="noopener noreferrer">
          Read more on Wikipedia
        </a>
        <Link href={reportHref(leader.name)} className="link-btn" style={{ display: 'inline-flex', alignItems: 'center' }}>
          Report an error
        </Link>
      </div>
    </section>
  );
}

export function OrderCard({ ids }: { ids: readonly string[] }) {
  const { byId } = useApp();
  return (
    <section aria-label="The right order" className={`card ${s.leader}`}>
      <span className="eyebrow muted">The right order</span>
      <ol className={s.order}>
        {ids.map((id) => {
          const l = byId(id);
          return (
            <li key={id}>
              <strong>{l.tookOffice}</strong>
              <span style={{ fontWeight: 700 }}>{l.name}</span>
              <span className="muted" style={{ fontSize: 13 }}>
                {l.country}
              </span>
            </li>
          );
        })}
      </ol>
      <Link href={reportHref(ids.map((id) => byId(id).name).join(', '))} className="link-btn" style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center' }}>
        Report an error
      </Link>
    </section>
  );
}

export interface GridCell {
  kind: 'g' | 'y' | 'x' | 'gap';
  arrow?: '↑' | '↓';
}

interface ResultProps {
  mode: Mode;
  won: boolean;
  used: number;
  scoreLine: string;
  /** Stamp the result in: the game was won just now. */
  celebrate: boolean;
  grid: GridCell[][];
  shareText: string;
  hint?: boolean;
  children: ReactNode;
}

export function Result({ mode, won, used, scoreLine, celebrate, grid, shareText, hint = false, children }: ResultProps) {
  const { status, frozen, state, n } = useApp();
  const streak = currentStreak(state.streak, n);
  const share = useShare();
  const count = useCountdown();
  const next = MODES.find((m) => !status[m].done);
  const allDone = MODES.every((m) => status[m].done);
  return (
    <section aria-label="Result" className={s.result}>
      <div className={s.hero}>
        <span className={`stamp ${won ? '' : s.stampLost} ${celebrate && !frozen && !state.settings.reduce ? s.stampIn : ''}`}>{verdict(mode, won, used)}</span>
        <h2 className="title">{won ? (mode === 'timeline' ? 'All in order!' : 'You got it!') : 'Not this time'}</h2>
        <p className={s.score}>{scoreLine}</p>
        {streak > 1 && <p className="eyebrow muted">{streak} days in a row</p>}
      </div>
      <div className={s.resultCols}>
        {children}
        <section aria-label="Share" className={s.share}>
          <div className={s.shareCard}>
            <span className={s.shareTitle}>
              Leaderdle #{n} · {MODE_NAMES[mode]} {score(mode, { won, used })}
              {hint && (
                <svg role="img" aria-label="Initials hint used" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
                </svg>
              )}
            </span>
            <div role="img" aria-label="Result grid without spoilers" className={s.grid}>
              {grid.map((row, i) => (
                <div key={i} className={s.gridRow}>
                  {row.map((c, j) => (
                    <span key={j} className={`${s.cell} ${c.kind === 'g' ? s.cellG : c.kind === 'y' ? s.cellY : c.kind === 'gap' ? s.cellGap : ''}`}>
                      {c.arrow}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <span className={s.site}>leaderdle.com</span>
          </div>
          <button type="button" className="btn btn--lg" onClick={() => share(shareText)}>
            <IconShare size={22} />
            Share result
          </button>
          {next && (
            <Link href={`/${next}`} className="btn btn--md">
              Next up: {MODE_NAMES[next]}
            </Link>
          )}
          {allDone && (
            <Link href="/summary" className="btn btn--md">
              See today's summary
            </Link>
          )}
          <p style={{ textAlign: 'center' }}>
            Next {MODE_NAMES[mode]} in <strong className="num">{count}</strong>
          </p>
        </section>
      </div>
    </section>
  );
}

export function HintOffer({ onReveal }: { onReveal: () => void }) {
  return (
    <div className={`card ${s.hintOffer}`}>
      <span>
        <strong>Stuck?</strong> Reveal the leader's initials. It doesn't cost a guess, but it adds a light bulb to your shared result.
      </span>
      <button type="button" className="btn" onClick={onReveal}>
        <IconBulb size={20} />
        Reveal initials
      </button>
    </div>
  );
}

export function HintShown({ initials }: { initials: string }) {
  return (
    <p role="status" className={s.hintShown}>
      <IconBulb size={22} />
      <span>
        Initials: <strong>{initials}</strong>
      </span>
    </p>
  );
}

export { s as gameStyles };

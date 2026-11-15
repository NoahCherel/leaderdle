import { useEffect, type ReactNode } from 'react';
import { Link } from 'wouter';
import { useApp } from '../app/context';
import { useCountdown, useShare } from '../app/hooks';
import { AdSlot, Flag, MODE_COLOR, ModePills } from '../components/Chrome';
import { IconBulb, IconShare } from '../components/icons';
import { ROLE_LABEL } from '../game/compare';
import { isInOffice, termSpan, yearsInOffice } from '../game/tenure';
import { MAX, MODE_NAMES, MODES, type Leader, type Mode } from '../game/types';
import s from './game.module.css';

/** Two columns on desktop (game + 300 × 600 ad), one column below 1000 px. */
export function GameLayout({ mode, children }: { mode: Mode; children: ReactNode }) {
  const { state, dispatch, openModal, frozen } = useApp();
  const seen = !!state.helpSeen[mode];
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

const CONFETTI_COLORS = ['var(--m1)', 'var(--m2)', 'var(--m3)', 'var(--g)', 'var(--y)', 'var(--text)'];

function Confetti({ animate }: { animate: boolean }) {
  const lefts = animate ? [4, 12, 21, 30, 38, 47, 55, 64, 72, 81, 89, 96] : [2, 6, 10, 14, 18, 22, 78, 82, 86, 90, 94, 97];
  return (
    <div aria-hidden="true" className={s.confetti}>
      {lefts.map((left, i) => (
        <span
          key={i}
          className={animate ? s.fall : undefined}
          style={{
            left: `${left}%`,
            top: animate ? 0 : `${(i * 37) % 90}px`,
            background: CONFETTI_COLORS[i % 6],
            animationDelay: animate ? `${700 + ((i * 97) % 500)}ms` : undefined,
          }}
        />
      ))}
    </div>
  );
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
      <span className="eyebrow muted">Today's leader</span>
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
  kind: 'g' | 'y' | 'x';
  arrow?: '↑' | '↓';
}

interface ResultProps {
  mode: Mode;
  won: boolean;
  used: number;
  scoreLine: string;
  /** Animate confetti: the game was won just now. */
  celebrate: boolean;
  grid: GridCell[][];
  shareText: string;
  hint?: boolean;
  children: ReactNode;
}

export function Result({ mode, won, used, scoreLine, celebrate, grid, shareText, hint = false, children }: ResultProps) {
  const { status, frozen, state, n } = useApp();
  const share = useShare();
  const count = useCountdown();
  const next = MODES.find((m) => !status[m].done);
  const allDone = MODES.every((m) => status[m].done);
  const showConfetti = won && !state.settings.reduce && (celebrate || frozen);
  return (
    <section aria-label="Result" className={s.result}>
      <div className={s.hero}>
        {showConfetti && <Confetti animate={celebrate && !frozen} />}
        <h2 className="title">{won ? (mode === 'timeline' ? 'All in order!' : 'You got it!') : 'So close!'}</h2>
        <p className={s.score}>{scoreLine}</p>
      </div>
      <div className={s.resultCols}>
        {children}
        <section aria-label="Share" className={s.share}>
          <div className={s.shareCard}>
            <span className={s.shareTitle}>
              Leaderdle #{n} · {MODE_NAMES[mode]} {won ? used : 'X'}/{MAX[mode]}
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
                    <span key={j} className={`${s.cell} ${c.kind === 'g' ? s.cellG : c.kind === 'y' ? s.cellY : ''}`}>
                      {c.arrow}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <span className={s.site}>leaderdle.com</span>
          </div>
          <button type="button" className="btn btn--lg" style={{ ['--btn-bg' as string]: MODE_COLOR[mode] }} onClick={() => share(shareText)}>
            <IconShare size={22} />
            Share result
          </button>
          {next && (
            <Link href={`/${next}`} className="btn btn--md" style={{ ['--btn-bg' as string]: MODE_COLOR[next] }}>
              Next up: {MODE_NAMES[next]}
            </Link>
          )}
          {allDone && (
            <Link href="/summary" className="btn btn--md" style={{ ['--btn-bg' as string]: 'var(--g)' }}>
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
      <button type="button" className="btn" style={{ ['--btn-bg' as string]: 'var(--y)' }} onClick={onReveal}>
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

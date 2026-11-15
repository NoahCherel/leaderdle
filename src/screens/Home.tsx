import { Link } from 'wouter';
import { useApp } from '../app/context';
import { useCountdown } from '../app/hooks';
import { AdSlot, Footer, MODE_COLOR } from '../components/Chrome';
import { IconCheck, IconUp, IconWave } from '../components/icons';
import { currentStreak } from '../game/stats';
import type { Status } from '../game/status';
import { MAX, MODE_NAMES, MODES, type Mode } from '../game/types';
import s from './home.module.css';

export function stateLabel(mode: Mode, st: Status): string {
  if (st.won) return `Solved ${st.used}/${MAX[mode]}`;
  if (st.lost) return `Missed X/${MAX[mode]}`;
  return st.used ? `In progress · ${st.used}/${MAX[mode]}` : 'Not played yet';
}

const cta = (st: Status) => (st.done ? 'See result' : st.used ? 'Keep going' : 'Play');

function BonusCard({ mode, text, cells }: { mode: Mode; text: string; cells: Array<string | null> }) {
  const { status } = useApp();
  const st = status[mode];
  return (
    <section aria-label={MODE_NAMES[mode]} className={s.mode} style={{ ['--mc' as string]: MODE_COLOR[mode] }}>
      <div className={s.modeTop}>
        <span className="eyebrow">Bonus</span>
        <span className="badge">{stateLabel(mode, st)}</span>
      </div>
      <h2 className="title">{MODE_NAMES[mode]}</h2>
      <p>{text}</p>
      <div aria-hidden="true" className={s.mini}>
        {cells.map((c, i) => (
          <span key={i} className={c === '?' ? s.dark : undefined}>
            {c}
          </span>
        ))}
      </div>
      <Link href={`/${mode}`} className={`btn ${s.cta}`}>
        {cta(st)}
      </Link>
    </section>
  );
}

export function Home() {
  const { status, state, n, openModal } = useApp();
  const count = useCountdown();
  const c = status.classic;
  const allDone = MODES.every((m) => status[m].done);
  const perfect = MODES.every((m) => status[m].won);
  const h = state.stats.classic;
  const streak = currentStreak(state.streak, n);

  return (
    <div className={s.layout}>
      <main className={s.main}>
        <div className={s.intro}>
          <div className={s.introRow}>
            <h1 className="title">Today's puzzles</h1>
            <span className={s.no}>#{n}</span>
          </div>
          <p className={s.lead}>Guess the world leader from five clues. Same puzzle for everyone, new ones at midnight.</p>
        </div>
        {allDone && (
          <section aria-label="Day complete" className={`card ${s.complete}`}>
            <div>
              <strong>Day complete!</strong>
              <br />
              <span className="muted">All three puzzles are done. Come back after midnight.</span>
            </div>
            <Link href="/summary" className="btn" style={{ ['--btn-bg' as string]: 'var(--g)' }}>
              See today's summary
            </Link>
          </section>
        )}
        <section aria-label="Classic" className={`${s.mode} ${s.classic}`} style={{ ['--mc' as string]: 'var(--m1)' }}>
          <div className={s.modeTop}>
            <span className="eyebrow">Main game</span>
            <span className={`badge ${s.badge}`}>{stateLabel('classic', c)}</span>
          </div>
          <h2 className="title">Classic</h2>
          <p>Name a leader. Five tiles tell you how close you are. You get 8 tries.</p>
          <div aria-hidden="true" className={s.qs}>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i}>?</span>
            ))}
          </div>
          <p className={s.cols}>Country · Role · Took office · Years in office · Age at start</p>
          <Link href="/classic" className={`btn btn--lg ${s.cta}`}>
            {c.done ? 'See result' : c.used ? 'Keep guessing' : 'Play Classic'}
          </Link>
        </section>
        <div className={s.bonus}>
          <BonusCard mode="succession" text="Who governed in between? 5 tries." cells={[null, '?', null]} />
          <BonusCard mode="timeline" text="Put 5 leaders in order. 3 checks." cells={['3', '1', '5', '2', '4']} />
        </div>
        <section aria-label="How it works" className={`card ${s.how}`}>
          <div className={s.howHead}>
            <h2 className="title">How it works</h2>
            <button type="button" className="btn btn--outline" onClick={() => openModal('help', 'classic')}>
              Full rules
            </button>
          </div>
          <div className={s.howGrid}>
            <div className={s.howItem}>
              <span aria-hidden="true" className={s.swatch} style={{ ['--sw' as string]: 'var(--g)' }}>
                <IconCheck size={20} />
              </span>
              <span>
                <strong>Correct</strong>
                <br />
                <span className="muted">An exact match with the answer.</span>
              </span>
            </div>
            <div className={s.howItem}>
              <span aria-hidden="true" className={s.swatch} style={{ ['--sw' as string]: 'var(--y)' }}>
                <IconWave size={20} />
              </span>
              <span>
                <strong>Close</strong>
                <br />
                <span className="muted">Same continent, a shared role, or a near miss.</span>
              </span>
            </div>
            <div className={s.howItem}>
              <span aria-hidden="true" className={s.swatch} style={{ ['--sw' as string]: 'var(--x)', color: 'var(--xt)' }}>
                <IconUp size={20} weight={4} />
              </span>
              <span>
                <strong>No match</strong>
                <br />
                <span className="muted">Arrows point toward the answer.</span>
              </span>
            </div>
          </div>
        </section>
        <Footer />
      </main>
      <aside className={s.aside}>
        <section aria-label="Today" className={`card ${s.side}`}>
          <h2 className="title">Today</h2>
          {MODES.map((m) => (
            <div key={m} className={s.today}>
              <span aria-hidden="true" className="dot" style={{ ['--dot' as string]: MODE_COLOR[m] }} />
              <strong>{MODE_NAMES[m]}</strong>
              <span>{stateLabel(m, status[m])}</span>
            </div>
          ))}
          <p className={s.small}>{perfect ? 'Perfect day! All three solved.' : 'Solve all three in one day to earn the Perfect day badge.'}</p>
        </section>
        <section aria-label="Your stats" className={`card ${s.side}`} style={{ gap: 12 }}>
          <h2 className="title">Your Classic stats</h2>
          <div className={s.figs}>
            <div>
              <strong>{h.played}</strong>
              <span>Played</span>
            </div>
            <div>
              <strong>{h.played ? `${Math.round((100 * h.wins) / h.played)}%` : '0%'}</strong>
              <span>Win rate</span>
            </div>
            <div>
              <strong>{streak}</strong>
              <span>Day streak</span>
            </div>
            <div>
              <strong>{h.best}</strong>
              <span>Best win streak</span>
            </div>
          </div>
          <button type="button" className="btn btn--outline" onClick={() => openModal('stats', 'classic')}>
            See all stats
          </button>
        </section>
        <div className={`card ${s.count}`}>
          <span>Next puzzles in</span>
          <strong>{count}</strong>
        </div>
        <AdSlot kind="box" />
      </aside>
    </div>
  );
}

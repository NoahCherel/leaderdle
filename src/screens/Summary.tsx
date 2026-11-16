import { Link, Redirect } from 'wouter';
import { useApp } from '../app/context';
import { useCountdown, usePhone, useShare } from '../app/hooks';
import { AdSlot, Footer } from '../components/Chrome';
import { IconShare } from '../components/icons';
import { dayLine, score, shareDay } from '../game/share';
import { currentStreak } from '../game/stats';
import { MODE_NAMES, MODES } from '../game/types';
import s from './home.module.css';

export function Summary() {
  const { status, n, frozen, state } = useApp();
  const count = useCountdown();
  const share = useShare();
  const phone = usePhone();
  const allDone = MODES.every((m) => status[m].done);
  const solved = MODES.filter((m) => status[m].won).length;
  const perfect = solved === MODES.length;
  const streak = currentStreak(state.streak, n);
  const mayhem = state.mayhem.stats;
  if (!allDone && !frozen) return <Redirect to="/" />;

  return (
    <main className="page page--narrow">
      <div className={s.summary}>
        <div className={s.sumHead}>
          <p className="eyebrow muted">No. {n} · closed</p>
          <h1 className="title">Day complete</h1>
          <span className={`stamp ${perfect ? '' : s.stampSub}`}>{perfect ? 'Perfect day' : `${solved} / ${MODES.length} solved`}</span>
          <p className={s.lead}>
            {perfect ? 'Four out of four.' : `${solved} of ${MODES.length} solved.`} {streak > 1 ? `That makes ${streak} days in a row. ` : ''}A fresh set arrives at midnight.
          </p>
        </div>
        <section aria-label="Today's results" className={s.results}>
          {MODES.map((m) => (
            <div key={m} className={s.resultRow}>
              <strong className="title">{MODE_NAMES[m]}</strong>
              <span className={s.score}>
                {phone ? '' : status[m].won ? 'Solved ' : 'Missed '}
                {score(m, status[m])}
              </span>
              <Link href={`/${m}`} className="btn btn--outline" aria-label={`View ${MODE_NAMES[m]} result`}>
                View
              </Link>
            </div>
          ))}
        </section>
        <div className={s.dayCard}>
          <span>Leaderdle #{n}</span>
          <span>{dayLine(status)}</span>
          <span className="muted">leaderdle.com</span>
        </div>
        <button type="button" className="btn btn--lg" onClick={() => share(shareDay(n, status))}>
          <IconShare size={22} />
          Share my day
        </button>
        <section aria-label="Bonus" className={s.bonus}>
          <Link href="/mayhem" className={s.row}>
            <span aria-hidden="true" className={`eyebrow ${s.idx}`}>
              +
            </span>
            <span className={s.what}>
              <strong className="title">Leader Mayhem</strong>
              <span className={s.rule}>Want to keep playing? Draft a government of five and take it through a tournament.</span>
            </span>
            <span className={`eyebrow ${s.state}`}>{mayhem.titles ? `${mayhem.titles} ${mayhem.titles === 1 ? 'title' : 'titles'}` : 'Bonus'}</span>
          </Link>
        </section>
        <div className={s.nextBar}>
          <span className="eyebrow muted">Next puzzles in</span>
          <strong>{count}</strong>
        </div>
        <AdSlot kind="box" />
        <div className={s.foot}>
          <Footer />
        </div>
      </div>
    </main>
  );
}

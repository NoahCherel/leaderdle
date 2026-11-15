import { Link, Redirect } from 'wouter';
import { useApp } from '../app/context';
import { useCountdown, usePhone, useShare } from '../app/hooks';
import { AdSlot, MODE_COLOR } from '../components/Chrome';
import { IconShare, IconStar } from '../components/icons';
import { dayLine, score, shareDay } from '../game/share';
import { MODE_NAMES, MODES } from '../game/types';
import s from './home.module.css';

export function Summary() {
  const { status, n, frozen } = useApp();
  const count = useCountdown();
  const share = useShare();
  const phone = usePhone();
  const allDone = MODES.every((m) => status[m].done);
  const perfect = MODES.every((m) => status[m].won);
  if (!allDone && !frozen) return <Redirect to="/" />;

  return (
    <main className="page page--narrow">
      <div className={s.summary}>
        <div className={s.sumHead}>
          {perfect && (
            <span className={s.perfect}>
              <IconStar size={20} />
              Perfect day
            </span>
          )}
          <h1 className="title">Day complete!</h1>
          <p className={s.lead}>{perfect ? 'Three out of three. See you after midnight.' : 'All three puzzles played. A fresh set arrives at midnight.'}</p>
        </div>
        <section aria-label="Today's results" className={`card ${s.results}`}>
          {MODES.map((m) => (
            <div key={m} className={s.resultRow}>
              <span aria-hidden="true" className="dot" style={{ width: 20, height: 20, ['--dot' as string]: MODE_COLOR[m] }} />
              <strong>{MODE_NAMES[m]}</strong>
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
          <span style={{ fontWeight: 500 }} className="muted">
            leaderdle.com
          </span>
        </div>
        <button type="button" className="btn btn--lg" style={{ ['--btn-bg' as string]: 'var(--m1)' }} onClick={() => share(shareDay(n, status))}>
          <IconShare size={22} />
          Share my day
        </button>
        <div className={`card ${s.nextBar}`}>
          <span style={{ fontWeight: 500, fontSize: 16 }}>Next puzzles in</span>
          <strong>{count}</strong>
        </div>
        <AdSlot kind="box" />
      </div>
    </main>
  );
}

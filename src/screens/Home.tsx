import { Link } from 'wouter';
import { useApp } from '../app/context';
import { useCountdown } from '../app/hooks';
import { AdSlot, Footer } from '../components/Chrome';
import { currentStreak } from '../game/stats';
import type { Status } from '../game/status';
import { MAX, MODE_NAMES, MODES, type Mode } from '../game/types';
import s from './home.module.css';

export function stateLabel(mode: Mode, st: Status): string {
  if (st.won) return `Solved ${st.used}/${MAX[mode]}`;
  if (st.lost) return `Missed X/${MAX[mode]}`;
  return st.used ? `In progress · ${st.used}/${MAX[mode]}` : 'Not played yet';
}

const RULE: Record<Mode, string> = {
  classic: 'Name a leader. Five clues tell you how close you are.',
  letters: 'Spell the name, letter by letter.',
  succession: 'Who governed in between?',
  timeline: 'Put five leaders in order.',
};
const TRIES: Record<Mode, string> = { classic: '8 tries', letters: '6 tries', succession: '5 tries', timeline: '3 checks' };

const dateline = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export function Home() {
  const { status, state, n, openModal, leaders } = useApp();
  const count = useCountdown();
  const done = MODES.filter((m) => status[m].done).length;
  const allDone = done === MODES.length;
  const perfect = MODES.every((m) => status[m].won);
  const next = MODES.find((m) => !status[m].done);
  const started = MODES.some((m) => status[m].used > 0);
  const streak = currentStreak(state.streak, n);
  const played = MODES.reduce((sum, m) => sum + state.stats[m].played, 0);
  const wins = MODES.reduce((sum, m) => sum + state.stats[m].wins, 0);
  // A stored day can name a leader who has left the list since: then the line is simply not shown.
  const mayhem = state.mayhem.stats;
  const yesterdayId = state.days[n - 1]?.puzzle.classic.answer;
  const yesterday = yesterdayId ? leaders.find((l) => l.id === yesterdayId) : undefined;

  return (
    <div className={s.layout}>
      <main className={s.main}>
        <div className={s.intro}>
          <p className={`eyebrow ${s.dateline}`}>
            No. {n} · {dateline(new Date())}
          </p>
          <h1 className="title">Today's puzzles</h1>
          <p className={s.lead}>Four short puzzles about world leaders since 1900. The same for everyone, new ones at midnight.</p>
        </div>

        <div className={s.go}>
          {next ? (
            <Link href={`/${next}`} className="btn btn--lg">
              {status[next].used ? 'Keep going' : started ? 'Next' : 'Play'}: {MODE_NAMES[next]}
            </Link>
          ) : (
            <Link href="/summary" className="btn btn--lg">
              See today's summary
            </Link>
          )}
          <p aria-live="polite" className={s.progress}>
            <span aria-hidden="true" className={s.pips}>
              {MODES.map((m) => (
                <span key={m} className={status[m].won ? s.pipWon : status[m].lost ? s.pipLost : undefined} />
              ))}
            </span>
            {allDone ? (perfect ? 'Perfect day: four out of four.' : 'Day complete. Come back after midnight.') : `${done} of ${MODES.length} done`}
          </p>
        </div>

        <ol className={s.docket}>
          {MODES.map((m, i) => {
            const st = status[m];
            return (
              <li key={m}>
                <Link href={`/${m}`} className={s.row}>
                  <span aria-hidden="true" className={`eyebrow ${s.idx}`}>
                    0{i + 1}
                  </span>
                  <span className={s.what}>
                    <strong className="title">{MODE_NAMES[m]}</strong>
                    <span className={s.rule}>{RULE[m]}</span>
                  </span>
                  <span className={`eyebrow ${s.state} ${st.won ? s.won : st.lost ? s.lost : st.used ? s.inProgress : ''}`}>{st.used || st.done ? stateLabel(m, st) : TRIES[m]}</span>
                </Link>
              </li>
            );
          })}
        </ol>

        <section aria-label="Bonus" className={s.bonus}>
          <Link href="/mayhem" className={s.row}>
            <span aria-hidden="true" className={`eyebrow ${s.idx}`}>
              +
            </span>
            <span className={s.what}>
              <strong className="title">Leader Mayhem</strong>
              <span className={s.rule}>Draft a government of five and take it through a tournament. As often as you like.</span>
            </span>
            <span className={`eyebrow ${s.state}`}>{mayhem.titles ? `${mayhem.titles} ${mayhem.titles === 1 ? 'title' : 'titles'}` : 'Bonus'}</span>
          </Link>
        </section>
      </main>
      <aside className={s.aside}>
        <section aria-label="Your record" className={s.side}>
          <h2 className="eyebrow">Your record</h2>
          <dl className={s.figs}>
            <div>
              <dt>Day streak</dt>
              <dd>{streak}</dd>
            </div>
            <div>
              <dt>Games played</dt>
              <dd>{played}</dd>
            </div>
            <div>
              <dt>Solved</dt>
              <dd>{played ? `${Math.round((100 * wins) / played)}%` : '–'}</dd>
            </div>
          </dl>
          <button type="button" className="btn btn--outline" onClick={() => openModal('stats', 'classic')}>
            See all stats
          </button>
        </section>
        <section aria-label="Next puzzles" className={s.side}>
          <h2 className="eyebrow">Next puzzles in</h2>
          <strong className={s.count}>{count}</strong>
          {yesterday && (
            <p className={s.small}>
              Yesterday's Classic was <strong>{yesterday.name}</strong>.
            </p>
          )}
        </section>
        <AdSlot kind="box" />
      </aside>
      <div className={s.foot}>
        <Footer />
      </div>
    </div>
  );
}

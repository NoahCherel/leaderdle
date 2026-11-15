import { useApp } from '../app/context';
import { currentWinStreak } from '../game/stats';
import { MAX, MODE_NAMES, MODES, type Mode } from '../game/types';
import { Modal, Toast } from './Chrome';
import { IconCheck, IconUp, IconWave } from './icons';
import s from './ui.module.css';

function Legend() {
  return (
    <div className={s.legend}>
      <div className={s.legendRow}>
        <span aria-hidden="true" className={s.swatch} style={{ ['--sw' as string]: 'var(--g)' }}>
          <IconCheck size={20} />
        </span>
        <span>
          <strong>Correct.</strong> An exact match.
        </span>
      </div>
      <div className={s.legendRow}>
        <span aria-hidden="true" className={s.swatch} style={{ ['--sw' as string]: 'var(--y)' }}>
          <IconWave size={20} />
        </span>
        <span>
          <strong>Close.</strong> Same continent, a shared role, or a near miss: within 10 years for Took office, 2 for Years in office, 5 for Age at start.
        </span>
      </div>
      <div className={s.legendRow}>
        <span aria-hidden="true" className={s.swatch} style={{ ['--sw' as string]: 'var(--x)', color: 'var(--xt)' }}>
          <IconUp size={20} weight={4} />
        </span>
        <span>
          <strong>No match.</strong> An arrow points to the answer: up means later, more or older.
        </span>
      </div>
    </div>
  );
}

function Mini({ cells }: { cells: Array<string | null> }) {
  return (
    <div aria-hidden="true" className={s.mini}>
      {cells.map((c, i) => (
        <span key={i} className={c === '?' ? s.miniDark : undefined}>
          {c}
        </span>
      ))}
    </div>
  );
}

function HelpBody({ mode }: { mode: Mode }) {
  if (mode === 'succession') {
    return (
      <>
        <p>Two leaders are shown. Name the one who governed between them. You get 5 tries.</p>
        <Mini cells={[null, '?', null]} />
        <p>Every miss unlocks a clue, in this order: the years, the role, the continent, then the country.</p>
        <p className="muted">No guess is wasted: each one brings you closer.</p>
      </>
    );
  }
  if (mode === 'letters') {
    return (
      <>
        <p>Spell the name of today's leader in 6 tries. Type any letters, then press Enter.</p>
        <div className={s.legend}>
          <div className={s.legendRow}>
            <span aria-hidden="true" className={s.swatch} style={{ ['--sw' as string]: 'var(--g)' }}>
              A
            </span>
            <span>
              <strong>Green.</strong> The letter is in the name, in this place.
            </span>
          </div>
          <div className={s.legendRow}>
            <span aria-hidden="true" className={s.swatch} style={{ ['--sw' as string]: 'var(--y)' }}>
              B
            </span>
            <span>
              <strong>Orange.</strong> The letter is in the name, in another place.
            </span>
          </div>
          <div className={s.legendRow}>
            <span aria-hidden="true" className={s.swatch} style={{ ['--sw' as string]: 'var(--x)', color: 'var(--xt)' }}>
              C
            </span>
            <span>
              <strong>Grey.</strong> The letter is not in the name.
            </span>
          </div>
        </div>
        <p className="muted">The name is the one the leader is best known by, without accents. Clues unlock after 2 and 4 misses.</p>
      </>
    );
  }
  if (mode === 'timeline') {
    return (
      <>
        <p>Put five leaders in order, from the earliest to take office to the most recent.</p>
        <Mini cells={['3', '1', '5', '2', '4']} />
        <p>Drag the cards, or use the arrows on each card. Then check your order: cards in the right place lock in.</p>
        <p className="muted">You get 3 checks. The years appear at the end.</p>
      </>
    );
  }
  return (
    <>
      <p>Find today's leader in 8 tries. Type a name, and five tiles compare your guess with the answer.</p>
      <Legend />
      <p className="muted">Role is Head of state, Head of government, or Both. A new puzzle arrives at midnight, your time.</p>
    </>
  );
}

function StatsBody() {
  const { state, n, modal, setStatTab } = useApp();
  const tab = modal.tab;
  const h = state.stats[tab];
  const cur = currentWinStreak(h, n);
  const top = Math.max(1, ...Object.values(h.dist));
  const pct = h.played ? `${Math.round((100 * h.wins) / h.played)}%` : '0%';
  return (
    <>
      <div role="tablist" aria-label="Game mode" className={s.tabs}>
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={m === tab}
            className={`${s.tab} ${m === tab ? s.tabOn : ''}`}
            onClick={() => setStatTab(m)}
          >
            {MODE_NAMES[m]}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={`${MODE_NAMES[tab]} stats`} className={s.modalBody} style={{ padding: 0 }}>
        <div className={s.figures}>
          <div className={s.figure}>
            <strong>{h.played}</strong>
            <span>Played</span>
          </div>
          <div className={s.figure}>
            <strong>{pct}</strong>
            <span>Win rate</span>
          </div>
          <div className={s.figure}>
            <strong>{cur}</strong>
            <span>Win streak</span>
          </div>
          <div className={s.figure}>
            <strong>{h.best}</strong>
            <span>Best streak</span>
          </div>
        </div>
        <div className={s.dist}>
          <strong>{tab === 'timeline' ? 'Checks needed' : 'Guesses needed'}</strong>
          {Array.from({ length: MAX[tab] }, (_, k) => k + 1).map((k) => {
            const count = h.dist[k] ?? 0;
            return (
              <div key={k} className={s.bar}>
                <span>{k}</span>
                <span className={`${s.barFill} ${count ? s.barOn : ''}`} style={{ width: count ? `${Math.round((100 * count) / top)}%` : '28px' }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p style={{ fontSize: 13 }} className="muted">
        Your stats are saved on this device only.
      </p>
    </>
  );
}

function SettingsBody() {
  const { state, dispatch, flash } = useApp();
  const rows: Array<[keyof typeof state.settings, string, string]> = [
    ['dark', 'Dark theme', 'Light text on a dark page.'],
    ['cb', 'Colorblind colors', 'Blue instead of green, easier to tell from orange.'],
    ['reduce', 'Reduce motion', 'Turn off tile flips, shakes and stamps.'],
  ];
  return (
    <>
      {rows.map(([key, title, text]) => {
        const on = state.settings[key];
        return (
          <div key={key} className={s.setting}>
            <span className={s.settingText}>
              <strong>{title}</strong>
              <small>{text}</small>
            </span>
            <button type="button" role="switch" aria-checked={on} aria-label={title} className={s.switch} onClick={() => dispatch({ type: 'setting', key, value: !on })}>
              {on ? 'On' : 'Off'}
            </button>
          </div>
        );
      })}
      <div className={s.setting}>
        <span className={s.settingText}>
          <strong>Clear my data</strong>
          <small>Erase today's games, streak and stats on this device.</small>
        </span>
        <button
          type="button"
          className={s.clear}
          onClick={() => {
            dispatch({ type: 'clear' });
            flash('Your data was cleared');
          }}
        >
          Clear
        </button>
      </div>
    </>
  );
}

export function Modals() {
  const { modal, closeModal } = useApp();
  const title = modal.kind === 'help' ? `How to play ${MODE_NAMES[modal.mode]}` : modal.kind === 'stats' ? 'Your stats' : 'Settings';
  const close = modal.kind === 'help' ? 'Got it' : modal.kind === 'stats' ? 'Close' : 'Done';
  return (
    <Modal open={modal.kind !== null} onClose={closeModal} titleId="modal-title">
      <h2 id="modal-title" className={`title ${s.modalTitle}`}>
        {title}
      </h2>
      {modal.kind === 'help' && <HelpBody mode={modal.mode} />}
      {modal.kind === 'stats' && <StatsBody />}
      {modal.kind === 'settings' && <SettingsBody />}
      <button type="button" className="btn btn--md btn--block" onClick={closeModal}>
        {close}
      </button>
      <Toast inDialog />
    </Modal>
  );
}

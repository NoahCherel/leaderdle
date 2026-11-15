import { useEffect, useRef, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useApp } from '../app/context';
import { currentStreak } from '../game/stats';
import { MODE_NAMES, MODES, type Mode, type Topic } from '../game/types';
import { IconHelp, IconSettings, IconStats } from './icons';
import s from './ui.module.css';

/** Game shown on the current route, or Classic elsewhere. */
export function useRouteMode(): Topic {
  const [path] = useLocation();
  const m = path.replace(/^\//, '');
  if (m === 'mayhem') return m;
  return MODES.includes(m as Mode) ? (m as Mode) : 'classic';
}

export function Header() {
  const { state, n, openModal } = useApp();
  const mode = useRouteMode();
  const streak = currentStreak(state.streak, n);
  return (
    <header className={s.header}>
      <div className={s.headerIn}>
      <Link href="/" className={s.logo} aria-label="Leaderdle home">
        Leader<span className={s.logoMark}>dle</span>
      </Link>
      <div className={s.spacer} />
      <div role="img" aria-label={`Streak: ${streak} ${streak === 1 ? 'day' : 'days'}`} className={`${s.streak} ${streak ? s.streakOn : ''}`}>
        <span>Streak</span>
        <strong>{streak}</strong>
      </div>
      <button type="button" className="icon-btn" aria-label="How to play" onClick={() => openModal('help', mode)}>
        <IconHelp />
      </button>
      <button type="button" className="icon-btn" aria-label="Statistics" onClick={() => openModal('stats', mode)}>
        <IconStats />
      </button>
      <button type="button" className="icon-btn" aria-label="Settings" onClick={() => openModal('settings', mode)}>
        <IconSettings />
      </button>
      </div>
    </header>
  );
}

export function ModePills({ current }: { current: Topic }) {
  const { status } = useApp();
  return (
    <nav aria-label="Game modes" className={s.pills}>
      {MODES.map((m) => {
        const cls = [s.pill, m === current && s.pillOn, status[m].won && s.pillWon, status[m].lost && s.pillLost].filter(Boolean).join(' ');
        return (
          <Link key={m} href={`/${m}`} className={cls} aria-current={m === current ? 'page' : undefined}>
            <span aria-hidden="true" className={s.pillDot} />
            {MODE_NAMES[m]}
            {status[m].done && <span className="sr-only">, {status[m].won ? 'solved' : 'missed'}</span>}
          </Link>
        );
      })}
      <Link href="/mayhem" className={`${s.pill} ${s.pillBonus} ${current === 'mayhem' ? s.pillOn : ''}`} aria-current={current === 'mayhem' ? 'page' : undefined}>
        <span aria-hidden="true" className={`${s.pillDot} ${s.pillDotBonus}`} />
        Mayhem
      </Link>
    </nav>
  );
}

const FOOT: Array<[string, string]> = [
  ['/about', 'About'],
  ['/how-we-pick', 'How we pick and describe leaders'],
  ['/privacy', 'Privacy'],
  ['/report', 'Report an error'],
];

export function Footer() {
  return (
    <footer className={s.footer}>
      {FOOT.map(([href, label]) => (
        <Link key={href} href={href}>
          {label}
        </Link>
      ))}
    </footer>
  );
}

/** Advertising slot with its size reserved from the start (PASSATION §8). */
export function AdSlot({ kind }: { kind: 'rail' | 'box' }) {
  const placeholder = import.meta.env.DEV;
  return (
    <aside aria-label="Advertisement" className={s.ad}>
      <span className={s.adLabel}>Advertisement</span>
      <div className={`${s.adSlot} ${kind === 'rail' ? s.adRail : s.adBox}`}>
        {placeholder &&
          (kind === 'rail' ? (
            <>
              <span className={s.railBig}>Ad space · 300 × 600</span>
              <span className={s.railSmall}>Ad space · 320 × 100</span>
            </>
          ) : (
            'Ad space · 300 × 250'
          ))}
      </div>
    </aside>
  );
}

/**
 * Confirmation bubble. A modal dialog sits in the browser's top layer, so while one is open
 * the bubble is rendered inside it instead, to stay visible above the veil.
 */
export function Toast({ inDialog = false }: { inDialog?: boolean }) {
  const { toast, modal } = useApp();
  if ((modal.kind !== null) !== inDialog) return null;
  return (
    <div role="status" aria-live="polite" className={toast ? s.toast : 'sr-only'}>
      {toast}
    </div>
  );
}

/**
 * Cookie choice. It sits in the page, under the header, so it can never cover the game,
 * the keyboard or a suggestion list (PASSATION §8), on any screen size.
 */
export function ConsentBanner() {
  const { state, dispatch } = useApp();
  if (state.consent !== null) return null;
  return (
    <div role="region" aria-label="Cookie consent" className={s.consent}>
      <div className={s.consentIn}>
        <p>Cookies help us show ads and count visits. The game works the same either way.</p>
        <div className={s.consentBtns}>
          <button type="button" className="btn btn--outline" onClick={() => dispatch({ type: 'consent', value: 'no' })}>
            Decline
          </button>
          <button type="button" className="btn btn--outline" onClick={() => dispatch({ type: 'consent', value: 'yes' })}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

const FLAGS = import.meta.glob<string>('/node_modules/flag-icons/flags/4x3/*.svg', { query: '?url', import: 'default', eager: true });

export function Flag({ iso2, country, code }: { iso2: string | null; country: string; code: string }) {
  const src = iso2 ? FLAGS[`/node_modules/flag-icons/flags/4x3/${iso2.toLowerCase()}.svg`] : undefined;
  if (!src) {
    return (
      <span role="img" aria-label={`Flag of ${country}`} className={`${s.flag} ${s.flagText}`}>
        {code}
      </span>
    );
  }
  return <img src={src} alt={`Flag of ${country}`} className={s.flag} width={48} height={36} />;
}

/** Native dialog: inert background, Escape closes, focus returns to the opener (PASSATION §11). */
export function Modal({ open, onClose, titleId, children }: { open: boolean; onClose: () => void; titleId: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement;
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    } else if (!open && d.open) {
      if (typeof d.close === 'function') d.close();
      else d.removeAttribute('open');
      (opener.current as HTMLElement | null)?.focus?.();
    }
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={s.modal}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && <div className={s.modalBody}>{children}</div>}
    </dialog>
  );
}

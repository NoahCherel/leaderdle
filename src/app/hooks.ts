import { useEffect, useState, useSyncExternalStore } from 'react';
import { countdown } from '../game/dates';
import { useApp } from './context';

/** Time left before midnight, ticking every second (frozen in capture scenes). */
export function useCountdown(): string {
  const { frozen } = useApp();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (frozen) return;
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [frozen]);
  return frozen ? '07:42:16' : countdown(now);
}

const media = (query: string) => {
  const subscribe = (cb: () => void) => {
    const m = window.matchMedia(query);
    m.addEventListener('change', cb);
    return () => m.removeEventListener('change', cb);
  };
  return () => useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
};

/** Phone layout, under 620 px (PASSATION §7). */
export const usePhone = media('(max-width: 619.98px)');
export const useCoarsePointer = media('(pointer: coarse)');

/** Shares on touch devices through the system sheet, copies elsewhere (PASSATION §9). */
export function useShare() {
  const { flash } = useApp();
  const coarse = useCoarsePointer();
  return async (text: string) => {
    if (coarse && typeof navigator.share === 'function') {
      try {
        await navigator.share({ text });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      flash('Copied to clipboard');
    } catch {
      flash('Copy is not available here');
    }
  };
}

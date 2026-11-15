import { useEffect, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { ConsentBanner, Header, Toast } from '../components/Chrome';
import { Modals } from '../components/Modals';
import { Classic } from '../screens/Classic';
import { Home } from '../screens/Home';
import { Letters } from '../screens/Letters';
import { ErrorScreen, Page } from '../screens/Pages';
import { Succession } from '../screens/Succession';
import { Summary } from '../screens/Summary';
import { Timeline } from '../screens/Timeline';
import { LAUNCH_DATE } from '../config';
import { puzzleNumber } from '../game/dates';
import { useApp } from './context';

/**
 * After local midnight, an open tab or installed app keeps the game in progress (PASSATION §12)
 * but offers the new puzzles.
 */
function NewDayBanner() {
  const { n, frozen } = useApp();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (frozen) return;
    const check = () => {
      if (puzzleNumber(new Date(), LAUNCH_DATE) > n) setReady(true);
    };
    const id = window.setInterval(check, 30_000);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, [n, frozen]);
  if (!ready) return null;
  return (
    <div className="page" style={{ paddingTop: 0, paddingBottom: 0 }}>
      <p role="status" className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '12px 16px', boxShadow: 'var(--sh-sm)', fontWeight: 700 }}>
        New puzzles are ready.
        <button type="button" className="btn" style={{ height: 44 }} onClick={() => window.location.reload()}>
          Load them
        </button>
      </p>
    </div>
  );
}

const TITLES: Record<string, string> = {
  '/': 'Leaderdle: guess the world leader',
  '/classic': 'Classic · Leaderdle',
  '/letters': 'Letters · Leaderdle',
  '/succession': 'Succession · Leaderdle',
  '/timeline': 'Timeline · Leaderdle',
  '/summary': 'Today’s summary · Leaderdle',
  '/about': 'About · Leaderdle',
  '/how-we-pick': 'How we pick and describe leaders · Leaderdle',
  '/privacy': 'Privacy · Leaderdle',
  '/report': 'Report an error · Leaderdle',
};

/** Applies theme, colorblind and reduced-motion classes to <html>. */
export function useThemeClasses(settings: { dark: boolean; cb: boolean; reduce: boolean }) {
  useEffect(() => {
    const c = document.documentElement.classList;
    c.toggle('th-dark', settings.dark);
    c.toggle('th-light', !settings.dark);
    c.toggle('cb', settings.cb);
    c.toggle('reduce', settings.reduce);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', settings.dark ? '#171613' : '#F3EEE3');
  }, [settings.dark, settings.cb, settings.reduce]);
}

export function App() {
  const { state, clearFresh } = useApp();
  const [path] = useLocation();
  useThemeClasses(state.settings);

  useEffect(() => {
    document.title = TITLES[path] ?? 'Page not found · Leaderdle';
    window.scrollTo(0, 0);
    clearFresh();
  }, [path, clearFresh]);

  return (
    <>
      <Header />
      <ConsentBanner />
      <NewDayBanner />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/classic" component={Classic} />
        <Route path="/letters" component={Letters} />
        <Route path="/succession" component={Succession} />
        <Route path="/timeline" component={Timeline} />
        <Route path="/summary" component={Summary} />
        <Route path="/about">{() => <Page slug="about" />}</Route>
        <Route path="/how-we-pick">{() => <Page slug="how-we-pick" />}</Route>
        <Route path="/privacy">{() => <Page slug="privacy" />}</Route>
        <Route path="/report">{() => <Page slug="report" />}</Route>
        <Route>{() => <ErrorScreen kind="404" />}</Route>
      </Switch>
      <Modals />
      <Toast />
    </>
  );
}

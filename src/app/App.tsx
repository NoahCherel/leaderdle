import { useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { ConsentBanner, Header, Toast } from '../components/Chrome';
import { Modals } from '../components/Modals';
import { Classic } from '../screens/Classic';
import { Home } from '../screens/Home';
import { ErrorScreen, Page } from '../screens/Pages';
import { Succession } from '../screens/Succession';
import { Summary } from '../screens/Summary';
import { Timeline } from '../screens/Timeline';
import { useApp } from './context';

const TITLES: Record<string, string> = {
  '/': 'Leaderdle: guess the world leader',
  '/classic': 'Classic · Leaderdle',
  '/succession': 'Succession · Leaderdle',
  '/timeline': 'Timeline · Leaderdle',
  '/summary': 'Today’s summary · Leaderdle',
  '/about': 'About · Leaderdle',
  '/how-we-pick': 'How we pick and describe leaders · Leaderdle',
  '/privacy': 'Privacy · Leaderdle',
  '/report': 'Report an error · Leaderdle',
};

/** Applies theme, colorblind and reduced-motion classes to <html>. */
export function useThemeClasses(settings: { light: boolean; cb: boolean; reduce: boolean }) {
  useEffect(() => {
    const c = document.documentElement.classList;
    c.toggle('th-light', settings.light);
    c.toggle('th-dark', !settings.light);
    c.toggle('cb', settings.cb);
    c.toggle('reduce', settings.reduce);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', settings.light ? '#FBF3E4' : '#1C1A2B');
  }, [settings.light, settings.cb, settings.reduce]);
}

export function App() {
  const { state } = useApp();
  const [path] = useLocation();
  useThemeClasses(state.settings);

  useEffect(() => {
    document.title = TITLES[path] ?? 'Page not found · Leaderdle';
    window.scrollTo(0, 0);
  }, [path]);

  return (
    <>
      <Header />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/classic" component={Classic} />
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
      <ConsentBanner />
      <Toast />
    </>
  );
}

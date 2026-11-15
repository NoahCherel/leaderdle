import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import './styles/base.css';

import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Router } from 'wouter';
import { App, useThemeClasses } from './app/App';
import { AppProvider } from './app/context';
import { LAUNCH_DATE } from './config';
import { loadGame } from './data/loader';
import { puzzleNumber } from './game/dates';
import { ErrorScreen, type ErrorKind } from './screens/Pages';
import { browserStorage, createStorage } from './store/storage';
import type { Settings } from './store/state';

const root = createRoot(document.getElementById('root')!);
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const render = (node: ReactNode) =>
  root.render(
    <StrictMode>
      <Router base={base}>{node}</Router>
    </StrictMode>,
  );

function Failure({ kind, settings }: { kind: ErrorKind; settings: Settings }) {
  useThemeClasses(settings);
  return <ErrorScreen kind={kind} />;
}

async function boot() {
  const params = new URLSearchParams(window.location.search);
  if (import.meta.env.DEV && params.has('scene')) {
    const { renderScene } = await import('./dev/scenes');
    return render(await renderScene(params));
  }

  const store = createStorage(browserStorage());
  const saved = store.load();
  const n = puzzleNumber(new Date(), LAUNCH_DATE);
  const result = await loadGame(n, saved);
  if (!result.ok) return render(<Failure kind={result.kind} settings={saved.settings} />);
  render(
    <AppProvider leaders={result.leaders} puzzle={result.puzzle} initial={saved} store={store}>
      <App />
    </AppProvider>,
  );
}

void boot();

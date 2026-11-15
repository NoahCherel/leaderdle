/**
 * Dev-only capture scenes: `?scene=<name>&theme=dark&colorblind=true`.
 * Same names as the prototype (PASSATION §1), so each state can be compared with leaderdle-passation/captures/.
 * Nothing is saved and the countdown is frozen.
 */
import { App } from '../app/App';
import { AppProvider, type SceneOverrides } from '../app/context';
import { LeaderFileSchema, type DayPuzzle } from '../data/schema';
import sampleLeaders from './sample-leaders.json';
import sampleMayhem from './sample-mayhem.json';
import { buildCells, newRun, offered, pick, playNext, type MayhemData, type MayhemRun } from '../game/mayhem';
import type { Leader } from '../game/types';
import { ErrorScreen } from '../screens/Pages';
import { initialState, reducer, type Action, type GameState } from '../store/state';

const N = 128;
const PUZZLE: DayPuzzle = {
  n: N,
  classic: { answer: 'mer' },
  letters: { answer: 'oba', word: 'OBAMA' },
  succession: { before: 'sch', answer: 'mer', after: 'olz', years: '2005 – 2021', beforeYears: '1998 – 2005', afterYears: '2021 – 2025' },
  timeline: { order: ['lky', 'tha', 'man', 'mer', 'ard'], start: ['man', 'ard', 'lky', 'mer', 'tha'] },
};

const three = ['lky', 'tha', 'man'];
const four = [...three, 'mer'];
const five = ['lky', 'tha', 'man', 'ard', 'chu'];
const mixed = ['lky', 'mer', 'man', 'tha', 'ard'];

const c = (ids: string[]): Action[] => ids.map((id) => ({ type: 'guess', n: N, mode: 'classic', id }));
const sg = (ids: string[]): Action[] => ids.map((id) => ({ type: 'guess', n: N, mode: 'succession', id }));
const lg = (words: string[]): Action[] => words.map((guess) => ({ type: 'letters', n: N, guess }));
const order = (o: string[]): Action => ({ type: 'order', n: N, order: o });
const check: Action = { type: 'check', n: N };
const tWon = [order(mixed), check, order(PUZZLE.timeline.order), check];
const full = [...c(four), ...lg(['ABOUT', 'OBAMA']), ...sg(['lky', 'mer']), ...tWon];

interface Scene {
  path: string;
  actions?: Action[];
  ui?: SceneOverrides;
  consent?: boolean;
  error?: 'offline' | 'data';
  /** Leader Mayhem: picks to make (first leader on offer, first free portfolio) and matches to play. */
  mayhem?: { picks: number; matches: number };
}

/** A Leader Mayhem run from seed 8, played the simple way, for the capture scenes. */
function mayhemRun(data: MayhemData, picks: number, matches: number): MayhemRun {
  let run = newRun(8, data);
  for (let i = 0; i < picks; i++) run = pick(run, offered(run, data)[0]!, run.team.indexOf(null), data);
  for (let i = 0; i < matches && !run.done; i++) run = playNext(run, data);
  return run;
}

const SCENES: Record<string, Scene> = {
  'home-first': { path: '/' },
  'home-progress': { path: '/', actions: c(three) },
  'home-done': { path: '/', actions: c(four) },
  'home-complete': { path: '/', actions: full },
  empty: { path: '/classic' },
  progress: { path: '/classic', actions: c(three) },
  resumed: { path: '/classic', actions: c(three), ui: { banner: true } },
  suggest: { path: '/classic', actions: c(['lky', 'tha']), ui: { q: 'ma', open: true } },
  nomatch: { path: '/classic', actions: c(['lky', 'tha']), ui: { q: 'zz', open: true } },
  typing: { path: '/classic', actions: c(three), ui: { q: 'ang', open: true, keyboard: true } },
  hint: { path: '/classic', actions: c(five) },
  'hint-used': { path: '/classic', actions: [...c(five), { type: 'hint', n: N }] },
  won: { path: '/classic', actions: c(four) },
  'won-hint': { path: '/classic', actions: [...c(three), { type: 'hint', n: N }, ...c(['mer'])] },
  lost: { path: '/classic', actions: c(['lky', 'tha', 'man', 'ard', 'chu', 'oba', 'bla', 'koh']) },
  'm-intro': { path: '/mayhem' },
  'm-draft': { path: '/mayhem', mayhem: { picks: 2, matches: 0 } },
  'm-ready': { path: '/mayhem', mayhem: { picks: 5, matches: 0 } },
  'm-match': { path: '/mayhem', mayhem: { picks: 5, matches: 1 } },
  'm-end': { path: '/mayhem', mayhem: { picks: 5, matches: 3 } },
  'l-empty': { path: '/letters' },
  'l-progress': { path: '/letters', actions: lg(['STERN', 'ABOUT', 'MAMBO']) },
  'l-won': { path: '/letters', actions: lg(['STERN', 'ABOUT', 'OBAMA']) },
  'l-lost': { path: '/letters', actions: lg(['STERN', 'ABOUT', 'MAMBO', 'OMAHA', 'BAMBI', 'ALAMO']) },
  help: { path: '/classic', actions: c(three), ui: { modal: 'help' } },
  stats: { path: '/classic', actions: c(four), ui: { modal: 'stats' } },
  settings: { path: '/classic', actions: c(three), ui: { modal: 'settings' } },
  's-empty': { path: '/succession' },
  's-progress': { path: '/succession', actions: sg(['lky', 'tha']) },
  's-won': { path: '/succession', actions: sg(['lky', 'mer']) },
  's-lost': { path: '/succession', actions: sg(['lky', 'tha', 'man', 'ard', 'koh']) },
  't-start': { path: '/timeline' },
  't-progress': { path: '/timeline', actions: [order(mixed), check] },
  't-won': { path: '/timeline', actions: tWon },
  't-lost': { path: '/timeline', actions: [order(mixed), check, check, check] },
  summary: { path: '/summary', actions: full },
  about: { path: '/about' },
  how: { path: '/how-we-pick' },
  privacy: { path: '/privacy' },
  report: { path: '/report' },
  consent: { path: '/', consent: true },
  'err-offline': { path: '/', error: 'offline' },
  'err-data': { path: '/', error: 'data' },
  'err-404': { path: '/missing-page' },
};

export const SCENE_NAMES = Object.keys(SCENES);

export async function renderScene(params: URLSearchParams) {
  const name = params.get('scene') ?? '';
  const scene = SCENES[name] ?? SCENES['home-first']!;
  const settings = { dark: params.get('theme') === 'dark', cb: params.get('colorblind') === 'true', reduce: false };
  const html = document.documentElement.classList;
  html.toggle('th-dark', settings.dark);
  html.toggle('th-light', !settings.dark);
  html.toggle('cb', settings.cb);

  window.history.replaceState(null, '', scene.path + window.location.search);
  if (scene.error) return <ErrorScreen kind={scene.error} />;

  // The prototype's 17 leaders plus Schröder and Scholz, so scenes match the design captures.
  const file = LeaderFileSchema.parse(sampleLeaders);
  let state: GameState = {
    ...initialState(),
    settings,
    consent: scene.consent ? null : 'no',
    helpSeen: { classic: true },
  };
  state = [{ type: 'start', puzzle: PUZZLE } as Action, ...(scene.actions ?? [])].reduce(reducer, state);
  const leaders = file.leaders as Leader[];
  const mayhem: MayhemData = { leaders, ratings: sampleMayhem.ratings, cells: buildCells(leaders, sampleMayhem.ratings, new Date(2026, 10, 15)) };
  if (scene.mayhem) state = reducer(state, { type: 'mayhem', run: mayhemRun(mayhem, scene.mayhem.picks, scene.mayhem.matches), total: 0 });

  return (
    <AppProvider leaders={leaders} puzzle={PUZZLE} initial={state} store={null} frozen scene={scene.ui ?? {}} mayhem={mayhem}>
      <App />
    </AppProvider>
  );
}

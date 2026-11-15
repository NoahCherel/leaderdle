import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type { DayPuzzle } from '../data/schema';
import { createSearch } from '../game/search';
import type { Leader, Mode } from '../game/types';
import { dayStatus, reducer, type Action, type DayRecord, type GameState } from '../store/state';
import type { Store } from '../store/storage';

export type ModalKind = 'help' | 'stats' | 'settings';

/** Dev-only overrides used to reproduce the design captures (`?scene=`). */
export interface SceneOverrides {
  q?: string;
  open?: boolean;
  keyboard?: boolean;
  banner?: boolean;
  /** Help, stats or settings window open on load. */
  modal?: ModalKind;
}

export interface AppValue {
  leaders: Leader[];
  byId: (id: string) => Leader;
  search: (q: string) => Leader[];
  n: number;
  state: GameState;
  dispatch: (a: Action) => void;
  day: DayRecord;
  status: ReturnType<typeof dayStatus>;
  /** True when a capture scene is shown: nothing is saved and the clock is frozen. */
  frozen: boolean;
  scene: SceneOverrides;
  /** The page was loaded with today's games already started. */
  resumed: boolean;
  modal: { kind: ModalKind | null; mode: Mode; tab: Mode };
  openModal: (kind: ModalKind, mode?: Mode) => void;
  closeModal: () => void;
  setStatTab: (m: Mode) => void;
  toast: string;
  flash: (text: string) => void;
  /** Last guess or check made in this session, to animate only that one. */
  fresh: { mode: Mode; id: string } | null;
  markFresh: (mode: Mode, id: string) => void;
}

const Ctx = createContext<AppValue | null>(null);

export function useApp(): AppValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}

interface Props {
  leaders: Leader[];
  puzzle: DayPuzzle;
  initial: GameState;
  store: Store | null;
  frozen?: boolean;
  scene?: SceneOverrides;
  children: ReactNode;
}

export function AppProvider({ leaders, puzzle, initial, store, frozen = false, scene = {}, children }: Props) {
  const [state, rawDispatch] = useReducer(reducer, initial, (s) => reducer(s, { type: 'start', puzzle }));
  const n = puzzle.n;
  const [resumed] = useState(() => {
    const d = initial.days[n];
    return !frozen && !!d && d.classic.length + d.succession.length + d.checks.length > 0;
  });

  useEffect(() => {
    if (!frozen) store?.save(state);
  }, [state, store, frozen]);

  const index = useMemo(() => new Map(leaders.map((l) => [l.id, l])), [leaders]);
  const byId = useCallback((id: string) => {
    const l = index.get(id);
    if (!l) throw new Error(`Unknown leader ${id}`);
    return l;
  }, [index]);
  const search = useMemo(() => createSearch(leaders), [leaders]);

  const [modal, setModal] = useState<AppValue['modal']>({ kind: scene.modal ?? null, mode: 'classic', tab: 'classic' });
  const openModal = useCallback((kind: ModalKind, mode: Mode = 'classic') => setModal({ kind, mode, tab: mode }), []);
  const closeModal = useCallback(() => setModal((m) => ({ ...m, kind: null })), []);
  const setStatTab = useCallback((tab: Mode) => setModal((m) => ({ ...m, tab })), []);

  const [toast, setToast] = useState('');
  const timer = useRef<number>();
  const flash = useCallback((text: string) => {
    window.clearTimeout(timer.current);
    setToast(text);
    timer.current = window.setTimeout(() => setToast(''), 2400);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const [fresh, setFresh] = useState<AppValue['fresh']>(null);
  const markFresh = useCallback((mode: Mode, id: string) => setFresh({ mode, id }), []);

  const day = state.days[n]!;
  const status = useMemo(() => dayStatus(day), [day]);

  const value: AppValue = {
    leaders, byId, search, n, state, dispatch: rawDispatch, day, status, frozen, scene, resumed,
    modal, openModal, closeModal, setStatTab, toast, flash, fresh, markFresh,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export type Role = 'state' | 'gov' | 'both';
export type Mode = 'classic' | 'letters' | 'succession' | 'timeline';
export const MODES: readonly Mode[] = ['classic', 'letters', 'succession', 'timeline'];
export const MAX: Record<Mode, number> = { classic: 8, letters: 6, succession: 5, timeline: 3 };
export const MODE_NAMES: Record<Mode, string> = { classic: 'Classic', letters: 'Letters', succession: 'Succession', timeline: 'Timeline' };

/** One continuous stint in office. Dates are ISO `YYYY-MM-DD`; `end: null` means still in office. */
export interface Term {
  start: string;
  end: string | null;
  office?: string;
}

export interface Leader {
  id: string;
  name: string;
  aliases: string[];
  country: string;
  /** ISO 3166-1 alpha-3, shown on phone tiles. */
  countryCode: string;
  /** ISO 3166-1 alpha-2 for the flag, null for former states without one. */
  iso2: string | null;
  continent: string;
  role: Role;
  tookOffice: number;
  ageAtStart: number;
  /** Total whole years in office as of the data snapshot. Recomputed from `terms` when present. */
  yearsInOffice: number;
  terms?: Term[];
  wiki?: string;
  blurb?: string;
  answerable?: boolean;
}

export type TileState = 'correct' | 'close' | 'miss';
export type Direction = 'up' | 'down' | null;

export interface Tile {
  key: 'country' | 'role' | 'took' | 'years' | 'age';
  label: string;
  /** Full text, shown on desktop and tablet. */
  value: string;
  /** Short code, shown on phones. */
  short: string;
  state: TileState;
  dir: Direction;
  numeric: boolean;
  inOffice: boolean;
  /** Screen reader label, e.g. "Took office: 1979, target is later". */
  aria: string;
}

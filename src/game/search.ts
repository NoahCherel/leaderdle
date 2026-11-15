import type { Leader } from './types';

/** Lowercase, no accents, no punctuation, single spaces. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

interface Entry {
  leader: Leader;
  /** Normalized name and variants. */
  keys: string[];
}

/**
 * Builds a search over the leader list (PASSATION §6): case, accent and punctuation
 * insensitive, matches variants, ranks names that start with the query, then names
 * with a word starting with it, then any substring. Ties keep list order.
 */
export function createSearch(leaders: Leader[]): (query: string) => Leader[] {
  const entries: Entry[] = leaders.map((leader) => ({
    leader,
    keys: [leader.name, ...leader.aliases].map(normalize),
  }));

  return (query: string) => {
    const q = normalize(query);
    if (!q) return leaders.slice();
    const ranked: Array<[number, number, Leader]> = [];
    entries.forEach((e, i) => {
      let best = Infinity;
      for (const key of e.keys) {
        if (key.startsWith(q)) best = Math.min(best, 0);
        else if (key.includes(' ' + q)) best = Math.min(best, 1);
        else if (key.includes(q)) best = Math.min(best, 2);
      }
      if (best < Infinity) ranked.push([best, i, e.leader]);
    });
    return ranked.sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((r) => r[2]);
  };
}

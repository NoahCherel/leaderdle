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
  /** Normalized name, then other names. */
  name: string;
  aliases: string[];
}

/** 0: starts with the query, 1: a word starts with it, 2: contains it, Infinity: no match. */
const score = (key: string, q: string) => (key.startsWith(q) ? 0 : key.includes(' ' + q) ? 1 : key.includes(q) ? 2 : Infinity);

/** The other name that matched the query, when the shown name did not (shown in suggestions). */
export function matchedAlias(leader: Leader, query: string): string | undefined {
  const q = normalize(query);
  if (!q || normalize(leader.name).includes(q)) return undefined;
  return leader.aliases.find((a) => normalize(a).includes(q));
}

/**
 * Builds a search over the leader list (PASSATION §6): case, accent and punctuation
 * insensitive. Names that start with the query come first, then names with a word
 * starting with it, then any substring, then the same for other names. Ties keep list order.
 */
export function createSearch(leaders: Leader[]): (query: string) => Leader[] {
  const entries: Entry[] = leaders.map((leader) => ({
    leader,
    name: normalize(leader.name),
    aliases: leader.aliases.map(normalize),
  }));

  return (query: string) => {
    const q = normalize(query);
    if (!q) return leaders.slice();
    const ranked: Array<[number, number, Leader]> = [];
    entries.forEach((e, i) => {
      // Matches on the shown name first, then on other names.
      let best = score(e.name, q);
      for (const a of e.aliases) best = Math.min(best, 3 + score(a, q));
      if (best < Infinity) ranked.push([best, i, e.leader]);
    });
    return ranked.sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((r) => r[2]);
  };
}

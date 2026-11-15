// Lists the leaders to rate for Leader Mayhem: every possible daily answer, plus the best-known
// leaders (60+ Wikipedia language editions) of the 20 countries with the most of them.
// Writes data/mayhem-pool.csv, sorted by country then year. Leaders already rated are marked.
// Usage: node scripts/mayhem/pool.ts
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { Leader } from '../../src/game/types.ts';
import { parseCsv, toCsv } from './csv.ts';

const MIN_SITELINKS = 60;
const TOP_COUNTRIES = 20;

const leaders: Leader[] = JSON.parse(readFileSync('public/data/leaders.json', 'utf8')).leaders;
const [head, ...rows] = parseCsv(readFileSync('data/review.csv', 'utf8'));
const col = (name: string) => head!.indexOf(name);
const sitelinks = new Map(rows.map((r) => [r[col('id')]!, Number(r[col('sitelinks')])]));
const rated = existsSync('data/mayhem-ratings.csv') ? new Set(parseCsv(readFileSync('data/mayhem-ratings.csv', 'utf8')).slice(1).map((r) => r[0])) : new Set<string>();

const known = leaders.filter((l) => (sitelinks.get(l.id) ?? 0) >= MIN_SITELINKS);
const perCountry = new Map<string, number>();
for (const l of known) perCountry.set(l.country, (perCountry.get(l.country) ?? 0) + 1);
const top = new Set([...perCountry.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_COUNTRIES).map(([c]) => c));

const pool = leaders
  .filter((l) => l.answerable || (top.has(l.country) && (sitelinks.get(l.id) ?? 0) >= MIN_SITELINKS))
  .sort((a, b) => a.country.localeCompare(b.country) || a.tookOffice - b.tookOffice);

writeFileSync(
  'data/mayhem-pool.csv',
  toCsv([['id', 'name', 'country', 'tookOffice', 'sitelinks', 'answerable', 'rated'], ...pool.map((l) => [l.id, l.name, l.country, l.tookOffice, sitelinks.get(l.id) ?? 0, l.answerable ? 'yes' : '', rated.has(l.id) ? 'yes' : ''])]),
);
console.log(`pool: ${pool.length} leaders in ${new Set(pool.map((l) => l.country)).size} countries, ${pool.filter((l) => rated.has(l.id)).length} rated`);

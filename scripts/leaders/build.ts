// Builds public/data/leaders.json, data/offices.json and data/review.csv from data/raw/ + data/overrides.json.
// Usage: node scripts/leaders/build.ts [--min=N] [--answer=N]
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { buildDataset, type Overrides, type RawData } from './build-lib.ts';

const arg = (name: string, fallback: number) => Number(process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback);
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'));

const raw: RawData = {
  countries: read('data/raw/countries.json'),
  holders: read('data/raw/holders.json'),
  aliases: read('data/raw/aliases.json'),
  settlements: read('data/raw/settlements.json'),
};
const overrides: Overrides = read('data/overrides.json');
const opts = { today: new Date(), minSitelinks: arg('min', 25), answerableSitelinks: arg('answer', 90) };

const { leaders, offices, review } = buildDataset(raw, overrides, opts);

const file = JSON.stringify({ version: 2, built: new Date().toISOString().slice(0, 10), source: 'Wikidata (CC0), checked by hand', leaders });
writeFileSync('public/data/leaders.json', file + '\n');
writeFileSync('data/offices.json', JSON.stringify(offices) + '\n');

const csv = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const cols = ['id', 'name', 'country', 'role', 'tookOffice', 'yearsInOffice', 'ageAtStart', 'sitelinks', 'guessable', 'answerable', 'flags'] as const;
const rows = review
  .filter((r) => r.guessable || r.flags.length)
  .sort((a, b) => b.sitelinks - a.sitelinks)
  .map((r) => cols.map((c) => csv(c === 'flags' ? r.flags.join('; ') : r[c])).join(','));
writeFileSync('data/review.csv', [cols.join(','), ...rows].join('\n') + '\n');

const flagged = review.filter((r) => r.guessable && r.flags.length);
const counts: Record<string, number> = {};
for (const r of flagged) for (const f of r.flags) counts[f] = (counts[f] ?? 0) + 1;
console.log(`leaders: ${leaders.length} guessable, ${leaders.filter((l) => l.answerable).length} answerable`);
console.log(`leaders.json: ${(file.length / 1024).toFixed(0)} KB, ${(gzipSync(file).length / 1024).toFixed(0)} KB gzip`);
console.log(`offices: ${Object.keys(offices).length}`);
console.log(`to review (guessable with flags): ${flagged.length}`, counts);

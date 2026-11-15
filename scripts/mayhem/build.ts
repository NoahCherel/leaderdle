// Turns data/mayhem-ratings.csv into public/data/mayhem.json and reports how playable the mode is.
// Usage: node scripts/mayhem/build.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { buildCells, PORTFOLIOS } from '../../src/game/mayhem.ts';
import type { Leader } from '../../src/game/types.ts';
import { parseCsv } from './csv.ts';

const leaders: Leader[] = JSON.parse(readFileSync('public/data/leaders.json', 'utf8')).leaders;
const known = new Set(leaders.map((l) => l.id));
const [head, ...rows] = parseCsv(readFileSync('data/mayhem-ratings.csv', 'utf8'));
if (head!.slice(2, 7).join() !== PORTFOLIOS.join()) throw new Error(`mayhem-ratings.csv: columns must be id,name,${PORTFOLIOS.join(',')},why`);

const errors: string[] = [];
const ratings: Record<string, number[]> = {};
for (const [i, r] of rows.entries()) {
  const [id, name] = r;
  const values = r.slice(2, 7).map(Number);
  const where = `line ${i + 2} (${name})`;
  if (!id || !known.has(id)) errors.push(`${where}: unknown leader id ${id}`);
  else if (ratings[id]) errors.push(`${where}: ${id} is rated twice`);
  if (values.length !== 5 || values.some((v) => !Number.isInteger(v) || v < 1 || v > 10)) errors.push(`${where}: ratings must be five whole numbers from 1 to 10`);
  if (id) ratings[id] = values;
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

writeFileSync('public/data/mayhem.json', JSON.stringify({ version: 1, ratings }) + '\n');

const cells = buildCells(leaders, ratings);
const playable = cells.filter((c) => c.leaders.length >= 2);
const mean = (k: number) => (Object.values(ratings).reduce((s, v) => s + v[k]!, 0) / rows.length).toFixed(1);
console.log(`mayhem: ${rows.length} leaders rated, ${playable.length} playable draws in ${new Set(playable.map((c) => c.country)).size} countries`);
console.log(`mean rating: ${PORTFOLIOS.map((p, k) => `${p} ${mean(k)}`).join(', ')}`);
const allHigh = Object.entries(ratings).filter(([, v]) => v.every((x) => x >= 8));
if (allHigh.length) console.log(`8 or more everywhere (check these): ${allHigh.map(([id]) => leaders.find((l) => l.id === id)!.name).join(', ')}`);

// Adds ratings written by name to data/mayhem-ratings.csv. Each line: `Name|e w ec d f|why`.
// Names must match data/mayhem-pool.csv exactly; nothing is written if one does not, or is rated already.
// Usage: node scripts/mayhem/add.ts <file>
import { readFileSync, writeFileSync } from 'node:fs';
import { parseCsv, toCsv } from './csv.ts';

const file = process.argv[2];
if (!file) throw new Error('Usage: node scripts/mayhem/add.ts <file>');
const pool = parseCsv(readFileSync('data/mayhem-pool.csv', 'utf8')).slice(1);
const byName = new Map(pool.map((r) => [r[1]!, r[0]!]));
const ratings = parseCsv(readFileSync('data/mayhem-ratings.csv', 'utf8'));
const rated = new Set(ratings.slice(1).map((r) => r[0]));

const errors: string[] = [];
const added: string[][] = [];
for (const [i, line] of readFileSync(file, 'utf8').split(/\r?\n/).entries()) {
  if (!line.trim()) continue;
  const [name, values, why] = line.split('|');
  const id = byName.get(name!.trim());
  const nums = (values ?? '').trim().split(/\s+/);
  if (!id) errors.push(`line ${i + 1}: no leader named "${name}" in the pool`);
  else if (rated.has(id)) errors.push(`line ${i + 1}: ${name} is rated already`);
  else if (nums.length !== 5 || nums.some((n) => !/^(10|[1-9])$/.test(n))) errors.push(`line ${i + 1}: ${name}: five ratings from 1 to 10 needed`);
  else if (!why?.trim()) errors.push(`line ${i + 1}: ${name}: a reason is needed`);
  else {
    rated.add(id);
    added.push([id, name!.trim(), ...nums, why.trim()]);
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
writeFileSync('data/mayhem-ratings.csv', toCsv([...ratings, ...added]));
console.log(`${added.length} added, ${rated.size} rated, ${pool.filter((r) => !rated.has(r[0]!)).length} left in the pool`);

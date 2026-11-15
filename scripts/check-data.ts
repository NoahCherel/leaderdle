// Fails the build when the shipped data is invalid: schema, unknown ids, non-answerable answers,
// gaps in day numbers. Run by `npm run build` (prebuild) and `npm run check:data`.
import { readdirSync, readFileSync } from 'node:fs';
import { DayPuzzleSchema, LeaderFileSchema } from '../src/data/schema.ts';
import { lettersWord } from '../src/game/letters.ts';

const errors: string[] = [];
const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'));

const leadersFile = LeaderFileSchema.safeParse(read('public/data/leaders.json'));
if (!leadersFile.success) {
  console.error(leadersFile.error.issues.slice(0, 10));
  process.exit(1);
}
const leaders = new Map(leadersFile.data.leaders.map((l) => [l.id, l]));
if (leaders.size !== leadersFile.data.leaders.length) errors.push('duplicate leader ids');

const files = readdirSync('public/data/days').filter((f) => f.endsWith('.json'));
const numbers = files.map((f) => Number(f.replace('.json', ''))).sort((a, b) => a - b);
numbers.forEach((n, i) => {
  if (n !== i + 1) errors.push(`day files are not numbered 1..${numbers.length} (found ${n} at position ${i + 1})`);
});

for (const f of files) {
  const parsed = DayPuzzleSchema.safeParse(read(`public/data/days/${f}`));
  if (!parsed.success) {
    errors.push(`${f}: ${parsed.error.issues[0]?.message}`);
    continue;
  }
  const d = parsed.data;
  if (`${d.n}.json` !== f) errors.push(`${f}: n is ${d.n}`);
  const all = [d.classic.answer, d.letters.answer, d.succession.before, d.succession.answer, d.succession.after, ...d.timeline.order, ...d.timeline.start];
  for (const id of all) if (!leaders.has(id)) errors.push(`${f}: unknown leader ${id}`);
  for (const id of [d.classic.answer, d.letters.answer, d.succession.answer, ...d.timeline.order]) {
    if (leaders.has(id) && !leaders.get(id)!.answerable) errors.push(`${f}: ${leaders.get(id)!.name} is not answerable`);
  }
  // The word to spell must be part of the leader's name as shown, so the answer card explains it.
  const lettersLeader = leaders.get(d.letters.answer);
  if (lettersLeader && !` ${lettersWord(lettersLeader.name)} `.includes(` ${d.letters.word} `)) errors.push(`${f}: "${d.letters.word}" is not in the name ${lettersLeader.name}`);
  if (d.letters.word.replace(/ /g, '').length > 11) errors.push(`${f}: "${d.letters.word}" is too long for a phone`);
  const years = d.timeline.order.map((id) => leaders.get(id)?.tookOffice ?? 0);
  if (years.some((y, i) => i > 0 && y <= years[i - 1]!)) errors.push(`${f}: Timeline order is not by year`);
}

if (errors.length) {
  console.error(`Data check failed (${errors.length}):\n` + errors.slice(0, 30).join('\n'));
  process.exit(1);
}
console.log(`data ok: ${leaders.size} leaders, ${files.length} days`);

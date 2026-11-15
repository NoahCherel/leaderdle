// Extends data/schedule.json (the published calendar, append-only) and writes public/data/days/{n}.json.
// Usage: node scripts/schedule/build.ts [--upto=N]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { DayPuzzle } from '../../src/data/schema.ts';
import type { Leader } from '../../src/game/types.ts';
import type { OfficeOut } from '../leaders/build-lib.ts';
import { extendSchedule, successionCandidates, type Forced } from './schedule-lib.ts';

const read = <T>(path: string, fallback?: T): T => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : (fallback as T));
const upTo = Number(process.argv.find((a) => a.startsWith('--upto='))?.split('=')[1] ?? 800);

const leaders: Leader[] = read<{ leaders: Leader[] }>('public/data/leaders.json').leaders;
const offices: Record<string, OfficeOut> = read('data/offices.json');
const existing: DayPuzzle[] = read('data/schedule.json', []);
const forced: Record<number, Forced> = read('data/schedule-forced.json', {});

const days = extendSchedule(existing, upTo, leaders, offices, forced, {
  seed: 20261115,
  classicGap: 240,
  successionGap: 150,
  timelineGap: 14,
  crossGap: 45,
});

writeFileSync('data/schedule.json', JSON.stringify(days, null, 0).replace(/},{"n"/g, '},\n{"n"') + '\n');
mkdirSync('public/data/days', { recursive: true });
for (const d of days) writeFileSync(`public/data/days/${d.n}.json`, JSON.stringify(d) + '\n');

console.log(`schedule: ${existing.length} kept, ${days.length - existing.length} added, ${days.length} days`);
console.log(`pool: ${leaders.filter((l) => l.answerable).length} answerable, ${successionCandidates(leaders, offices).length} Succession triples`);

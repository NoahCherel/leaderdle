// Plays many Leader Mayhem runs with two simple strategies and prints how often each wins the title.
// "random": any leader on offer, any free portfolio. "expert": knows every rating and places each
// leader on their best free portfolio, which is the ceiling a well-read player can approach.
// Usage: node scripts/mayhem/balance.ts [runs]
import { readFileSync } from 'node:fs';
import { buildCells, newRun, offered, pick, playNext, runOutcome, type MayhemData, type MayhemRun, type Outcome } from '../../src/game/mayhem.ts';
import { rng } from '../../src/game/rng.ts';
import type { Leader } from '../../src/game/types.ts';

const RUNS = Number(process.argv[2] ?? 4000);
const leaders: Leader[] = JSON.parse(readFileSync('public/data/leaders.json', 'utf8')).leaders;
const { ratings } = JSON.parse(readFileSync('public/data/mayhem.json', 'utf8'));
const known = new Set(leaders.map((l) => l.id));
const data: MayhemData = { leaders, ratings, cells: buildCells(leaders, ratings) };
for (const id of Object.keys(ratings)) if (!known.has(id)) delete ratings[id];

type Strategy = (run: MayhemRun, rand: () => number) => [string, number];
const free = (run: MayhemRun) => run.team.flatMap((t, i) => (t ? [] : [i]));

const random: Strategy = (run, rand) => {
  const ids = offered(run, data);
  const slots = free(run);
  return [ids[Math.floor(rand() * ids.length)]!, slots[Math.floor(rand() * slots.length)]!];
};
const expert: Strategy = (run) => {
  let best: [string, number] = ['', -1];
  let score = -1;
  for (const id of offered(run, data)) {
    for (const slot of free(run)) {
      // Prefers a strong fit, and keeps a leader's strongest field for them.
      const value = ratings[id][slot];
      if (value > score) [best, score] = [[id, slot], value];
    }
  }
  return best;
};

function play(strategy: Strategy, seed: number): Outcome {
  const rand = rng(seed * 7919);
  let run = newRun(seed, data);
  while (run.team.includes(null)) {
    const [id, slot] = strategy(run, rand);
    run = pick(run, id, slot, data);
  }
  while (!run.done) run = playNext(run, data);
  return runOutcome(run);
}

for (const [name, strategy] of [['random', random], ['expert', expert]] as const) {
  const count: Record<Outcome, number> = { quarter: 0, semi: 0, final: 0, champion: 0 };
  for (let seed = 1; seed <= RUNS; seed++) count[play(strategy, seed)]++;
  const pct = (n: number) => `${((100 * n) / RUNS).toFixed(1)} %`;
  console.log(`${name.padEnd(7)} champion ${pct(count.champion)} · final ${pct(count.final)} · semi ${pct(count.semi)} · out in quarter ${pct(count.quarter)}`);
}

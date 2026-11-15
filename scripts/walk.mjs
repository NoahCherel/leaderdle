// Plays a real day on the dev server (real data, 15 Nov 2026) and screenshots each step.
// Usage: npm run dev, then node scripts/walk.mjs 360|1280 [dark] → test-results/walk-<width>[-dark]/
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const W = Number(process.argv[2] ?? 360);
const dark = process.argv[3] === 'dark';
const base = 'http://localhost:5173';
const dir = `test-results/walk-${W}${dark ? '-dark' : ''}`;
mkdirSync(dir, { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: W < 620 ? 760 : 860 }, hasTouch: W < 620, isMobile: W < 620, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.clock.install({ time: new Date(2026, 10, 15, 12) });
let i = 0;
const shot = async (name, full = false) => {
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${dir}/${String(++i).padStart(2, '0')}-${name}.png`, fullPage: full });
};
const day = await (await fetch(`${base}/data/days/128.json`)).json();
const L = new Map((await (await fetch(`${base}/data/leaders.json`)).json()).leaders.map((l) => [l.id, l]));
console.log('classic', L.get(day.classic.answer).name, '| letters', day.letters.word, '| succession', L.get(day.succession.answer).name);

await p.goto(base + '/');
if (dark) {
  await p.getByRole('button', { name: 'Settings' }).click();
  await p.getByRole('switch', { name: 'Dark theme' }).click();
  await p.getByRole('button', { name: 'Done' }).click();
}
await shot('home-first', true);
await p.getByRole('link', { name: 'Play: Classic' }).click();
await shot('help-auto');
await p.getByRole('button', { name: 'Got it' }).click();
await shot('classic-empty');
const input = p.getByRole('combobox');
await input.fill('ma');
await shot('typing-ma');
for (const n of ['Angela Merkel', 'Barack Obama', 'Nelson Mandela', 'Jawaharlal Nehru', 'Fidel Castro']) {
  await input.fill(n);
  await input.press('Enter');
  await p.waitForTimeout(1200);
}
await shot('hint-offer', true);
await p.getByRole('button', { name: 'Reveal initials' }).click();
await input.fill(L.get(day.classic.answer).name);
await input.press('Enter');
await p.waitForTimeout(1500);
await shot('classic-won', true);

await p.getByRole('link', { name: /Next up/ }).click();
await shot('letters-empty', true);
const shape = day.letters.word;
const filler = (letters) => [...shape].filter((c) => c !== ' ').map((_, k) => letters[k % letters.length]).join('');
for (const letters of ['AEIOU', 'RSTLN']) {
  await p.keyboard.type(filler(letters));
  await p.keyboard.press('Enter');
  await p.waitForTimeout(1600);
}
await p.keyboard.type(shape.replace(/ /g, '').slice(0, 3));
await shot('letters-progress', true);
for (let k = 0; k < 3; k++) await p.keyboard.press('Backspace');
await p.keyboard.type(shape.replace(/ /g, ''));
await p.keyboard.press('Enter');
await p.waitForTimeout(400);
await shot('letters-turning');
await p.waitForTimeout(2200);
await shot('letters-won', true);

await p.getByRole('link', { name: /Next up/ }).click();
await shot('succession-empty', true);
const si = p.getByRole('combobox');
await si.fill('Kohl');
await si.press('Enter');
await p.waitForTimeout(600);
await si.fill(L.get(day.succession.answer).name);
await si.press('Enter');
await p.waitForTimeout(1200);
await shot('succession-won', true);

await p.getByRole('link', { name: /Next up/ }).click();
await shot('timeline-start', true);
await p.getByRole('button', { name: 'Check my order' }).click();
await shot('timeline-after-check', true);
await p.goto(base + '/');
await shot('home-progress', true);
await p.getByRole('button', { name: 'Statistics' }).click();
await shot('stats');
await p.keyboard.press('Escape');
await p.goto(base + '/report?leader=Angela%20Merkel');
await shot('report', true);
await p.goto(base + '/nope');
await shot('404');
await b.close();

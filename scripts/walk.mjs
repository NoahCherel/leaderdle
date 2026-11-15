// Plays a real game on the dev server (real data, 15 Nov 2026) and screenshots each step.
// Usage: npm run dev, then node scripts/walk.mjs 360|1280 → test-results/walk-<width>/
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const W = Number(process.argv[2] ?? 360);
const dir = `test-results/walk-${W}`; mkdirSync(dir, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: W < 620 ? 760 : 860 }, hasTouch: W < 620, isMobile: W < 620, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.clock.install({ time: new Date(2026, 10, 15, 12) });
let i = 0; const shot = async (name, full = false) => { await p.waitForTimeout(250); await p.screenshot({ path: `${dir}/${String(++i).padStart(2, '0')}-${name}.png`, fullPage: full }); };
const day = (await (await fetch('http://localhost:5173/data/days/128.json')).json());
const L = new Map((await (await fetch('http://localhost:5173/data/leaders.json')).json()).leaders.map((l) => [l.id, l]));
console.log('answer', L.get(day.classic.answer).name, '| succ', L.get(day.succession.answer).name);
await p.goto('http://localhost:5173/'); await shot('home-first', true);
await p.getByRole('link', { name: 'Play Classic' }).click(); await shot('help-auto');
await p.getByRole('button', { name: 'Got it' }).click(); await shot('classic-empty');
const input = p.getByRole('combobox');
await input.click(); await shot('focus-list');
await input.fill('ma'); await shot('typing-ma');
for (const n of ['Angela Merkel', 'Barack Obama', 'Nelson Mandela']) { await input.fill(n); await input.press('Enter'); await p.waitForTimeout(1500); }
await shot('three-guesses', true);
for (const n of ['Jawaharlal Nehru', 'Fidel Castro']) { await input.fill(n); await input.press('Enter'); await p.waitForTimeout(1500); }
await shot('hint-offer', true);
await p.getByRole('button', { name: 'Reveal initials' }).click(); await shot('hint-shown');
for (const n of ['Vladimir Putin', 'Charles de Gaulle', 'Juan Perón']) { await input.fill(n); await input.press('Enter'); await p.waitForTimeout(1500); }
await shot('classic-end', true);
await p.getByRole('link', { name: /Next up/ }).click(); await p.getByRole('button', { name: 'Got it' }).click(); await shot('succession-empty', true);
const si = p.getByRole('combobox');
await si.fill('Kohl'); await si.press('Enter'); await p.waitForTimeout(600);
await si.fill(L.get(day.succession.answer).name); await si.press('Enter'); await p.waitForTimeout(1200);
await shot('succession-won', true);
await p.getByRole('link', { name: /Next up/ }).click(); await p.getByRole('button', { name: 'Got it' }).click(); await shot('timeline-start', true);
await p.getByRole('button', { name: 'Check my order' }).click(); await shot('timeline-after-check', true);
await p.goto('http://localhost:5173/'); await shot('home-progress', true);
await p.getByRole('button', { name: 'Settings' }).click(); await shot('settings');
await p.getByRole('switch', { name: 'Light theme' }).click(); await p.getByRole('button', { name: 'Done' }).click(); await shot('home-light', true);
await p.goto('http://localhost:5173/report?leader=Angela%20Merkel'); await shot('report', true);
await p.goto('http://localhost:5173/nope'); await shot('404');
await b.close();

// Screenshots every capture scene from the dev server, for comparison with leaderdle-passation/captures/.
// Usage: node scripts/shoot.mjs [scene,scene,...] [--widths=1280,360] [--theme=light] [--colorblind]
// Output: test-results/scenes/<width>[-light][-cb]/<scene>.png
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}`));
const widths = (flag('widths')?.split('=')[1] ?? '1280,360').split(',').map(Number);
const theme = flag('theme')?.split('=')[1];
const cb = !!flag('colorblind');
const ALL = [
  'home-first', 'home-progress', 'home-done', 'home-complete', 'empty', 'progress', 'resumed', 'suggest', 'nomatch',
  'hint', 'hint-used', 'won', 'won-hint', 'lost', 'help', 'stats', 'settings', 's-empty', 's-progress', 's-won', 's-lost',
  't-start', 't-progress', 't-won', 't-lost', 'summary', 'about', 'how', 'privacy', 'report', 'consent',
  'err-offline', 'err-data', 'err-404',
];
const list = args.find((a) => !a.startsWith('--'))?.split(',') ?? ALL;
const base = process.env.BASE ?? 'http://localhost:5173';

const browser = await chromium.launch();
for (const width of widths) {
  const dir = `test-results/scenes/${width}${theme ? '-' + theme : ''}${cb ? '-cb' : ''}`;
  mkdirSync(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width, height: width < 620 ? 800 : 800 }, deviceScaleFactor: 1 });
  for (const scene of list) {
    const q = new URLSearchParams({ scene });
    if (theme) q.set('theme', theme);
    if (cb) q.set('colorblind', 'true');
    await page.goto(`${base}/?${q}`);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${dir}/${scene}.png`, fullPage: true });
  }
  await page.close();
}
await browser.close();
console.log('done');

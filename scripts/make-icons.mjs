// Draws the favicon, app icons and the social image in the site's look (paper, ink, stamp red).
// Usage: node scripts/make-icons.mjs → public/favicon.svg, icon-*.png, og-image.png
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const font = readFileSync('node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff2').toString('base64');
const face = `@font-face{font-family:B;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:700}`;
const INK = '#1a1916';
const PAPER = '#f3eee3';
const RED = '#b92d18';
const GREEN = '#6fbf8b';
const ORANGE = '#f0a44b';
const GREY = '#d9d3c5';

// Favicon: an ink tile with the L, a red corner as the stamp.
writeFileSync(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="${INK}"/><path d="M20 14h9v28h16v8H20z" fill="${PAPER}"/><rect x="40" y="14" width="10" height="10" fill="${RED}"/></svg>\n`,
);

const icon = (size) => `<html><style>*{margin:0}body{width:${size}px;height:${size}px;background:${INK};display:flex;align-items:center;justify-content:center}</style>
<svg width="${size}" height="${size}" viewBox="0 0 64 64"><path d="M20 14h9v28h16v8H20z" fill="${PAPER}"/><rect x="40" y="14" width="10" height="10" fill="${RED}"/></svg></html>`;

const tiles = [
  ['L', GREEN], ['E', GREY], ['A', ORANGE], ['D', GREEN], ['E', GREY], ['R', GREEN],
];
const og = `<html><style>${face}*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;background:${PAPER};color:${INK};font-family:B;padding:70px 80px;display:flex;flex-direction:column;justify-content:space-between}
h1{font-size:170px;line-height:.9;letter-spacing:.03em}h1 span{color:${RED}}
.rule{border-top:10px double ${INK}}
.row{display:flex;gap:14px}.t{width:104px;height:104px;border:3px solid ${INK};border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:76px}
p{font-size:52px;letter-spacing:.04em;text-transform:uppercase}</style>
<div><h1>LEADER<span>DLE</span></h1></div><div class="rule"></div>
<div class="row">${tiles.map(([c, bg]) => `<div class="t" style="background:${bg}">${c}</div>`).join('')}</div>
<p>Guess the world leader · four puzzles a day</p></html>`;

const b = await chromium.launch();
for (const size of [32, 180, 512]) {
  const p = await b.newPage({ viewport: { width: size, height: size } });
  await p.setContent(icon(size));
  await p.screenshot({ path: `public/icon-${size}.png` });
  await p.close();
}
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(og);
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: 'public/og-image.png' });
await b.close();
console.log('icons written');

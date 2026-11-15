// After `vite build`: writes one index.html per route and a 404.html, so the site works
// on any static host without a rewrite rule (each URL is a real file).
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const ROUTES = {
  classic: 'Classic · Leaderdle',
  letters: 'Letters · Leaderdle',
  succession: 'Succession · Leaderdle',
  timeline: 'Timeline · Leaderdle',
  summary: 'Today’s summary · Leaderdle',
  about: 'About · Leaderdle',
  'how-we-pick': 'How we pick and describe leaders · Leaderdle',
  privacy: 'Privacy · Leaderdle',
  report: 'Report an error · Leaderdle',
};

const index = join(dist, 'index.html');
if (!existsSync(index)) throw new Error('Run vite build first');
const html = readFileSync(index, 'utf8');

for (const [route, title] of Object.entries(ROUTES)) {
  mkdirSync(join(dist, route), { recursive: true });
  const page = html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace('<link rel="canonical" href="https://leaderdle.com/" />', `<link rel="canonical" href="https://leaderdle.com/${route}" />`);
  writeFileSync(join(dist, route, 'index.html'), page);
}
writeFileSync(join(dist, '404.html'), html.replace(/<title>[^<]*<\/title>/, '<title>Page not found · Leaderdle</title>'));
copyFileSync(index, join(dist, 'index.html'));
console.log(`prerendered ${Object.keys(ROUTES).length} routes + 404.html`);

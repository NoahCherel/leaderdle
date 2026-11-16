import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { DAY_128, openAt, useSampleData } from './helpers';

const END = /^(Champion|Runner-up|Out in the (quarter|semi)-final)$/;

/** Takes the first leader on offer and gives them the first free portfolio. */
async function pickFirst(page: Page) {
  await page.getByRole('group', { name: 'Leaders in office' }).getByRole('button').first().click();
  await page.getByRole('button', { name: /^Give / }).first().click();
}

async function draft(page: Page) {
  for (let i = 1; i <= 5; i++) {
    await expect(page.getByText(`Pick ${i} of 5`)).toBeVisible();
    await pickFirst(page);
  }
}

async function playOut(page: Page) {
  for (let round = 0; round < 3; round++) {
    await page.getByRole('button', { name: /^Play the / }).click();
    // The five duels play through the arena one by one, then either the next round or the end appears.
    await expect(page.getByRole('button', { name: /^Play the / }).or(page.getByRole('heading', { name: END }))).toBeVisible({ timeout: 25_000 });
    if (await page.getByRole('heading', { name: END }).isVisible()) return;
  }
}

test('Leader Mayhem: draft five leaders, play the tournament, see the ratings, share', async ({ page, context }) => {
  test.setTimeout(60_000);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openAt(page, '/');
  await page.getByRole('button', { name: 'Decline' }).click();
  await page.getByRole('link', { name: /Leader Mayhem/ }).click();
  await expect(page).toHaveURL(/\/mayhem$/);
  await expect(page.getByText(/as we judge it/)).toBeVisible();
  await page.getByRole('button', { name: 'Form a government' }).click();

  // The draw names a decade and a country, and offers at least two leaders with their year.
  const draw = page.getByRole('region', { name: 'The draw' });
  await expect(draw).toContainText(/\d{4}s/);
  const offered = page.getByRole('group', { name: 'Leaders in office' }).getByRole('button');
  expect(await offered.count()).toBeGreaterThanOrEqual(2);
  await expect(offered.first()).toContainText(/'\d\d/);
  // No rating is shown while drafting.
  await expect(page.getByText(/\/10|\/50/)).toHaveCount(0);

  await draft(page);
  await expect(page.getByRole('region', { name: 'The draw' })).toHaveCount(0);
  await playOut(page);

  await expect(page.getByRole('heading', { name: END })).toBeVisible();
  // Ratings are ours: never shown, not even at the end.
  await expect(page.getByText(/\/10|\/50|rating/i)).toHaveCount(0);
  await page.getByRole('button', { name: 'Share result' }).click();
  const text = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n');
  expect(text).toMatch(/^Leaderdle · Leader Mayhem\n.*\nEDU: .+ \('\d\d\)\nWAR: .+\nECO: .+\nDOM: .+\nFOR: .+\nleaderdle\.com\/mayhem$/);

  // A bonus: the day streak and the day's games are untouched.
  await expect(page.getByRole('img', { name: 'Streak: 0 days' })).toBeVisible();
  await expect(page.getByText(/^1 played · \d titles?$/)).toBeVisible();
  await page.getByRole('button', { name: 'Form a new government' }).click();
  await expect(page.getByText('Pick 1 of 5')).toBeVisible();
});

test('Leader Mayhem: the same seed gives the same draws', async ({ page }) => {
  const firstDraw = async () => {
    await page.evaluate(() => localStorage.clear());
    await openAt(page, '/mayhem?seed=42');
    await page.getByRole('button', { name: 'Form a government' }).click();
    return page.getByRole('region', { name: 'The draw' }).innerText();
  };
  await openAt(page, '/mayhem?seed=42');
  const a = await firstDraw();
  expect(await firstDraw()).toBe(a);
});

test('Leader Mayhem: rerolls change the draw once each', async ({ page }) => {
  await openAt(page, '/mayhem?seed=3');
  await page.getByRole('button', { name: 'Form a government' }).click();
  const draw = page.getByRole('region', { name: 'The draw' });
  const before = await draw.innerText();
  const usable = page.getByRole('button', { name: /^Another (country|decade)$/ }).and(page.locator(':enabled'));
  test.skip((await usable.count()) === 0, 'this seed starts on a draw with no reroll available');
  const button = usable.first();
  const label = await button.innerText();
  await button.click();
  await expect(draw).not.toHaveText(before);
  await expect(page.getByRole('button', { name: new RegExp(label, 'i') })).toBeDisabled();
});

test('Leader Mayhem: a run survives a reload, while drafting and during the tournament', async ({ page }) => {
  await openAt(page, '/mayhem?seed=5');
  await page.getByRole('button', { name: 'Form a government' }).click();
  await pickFirst(page);
  await pickFirst(page);
  const sheet = page.getByRole('list', { name: 'Your government' });
  const before = await sheet.innerText();
  await page.reload();
  await expect(page.getByText('Pick 3 of 5')).toBeVisible();
  expect(await sheet.innerText()).toBe(before);

  for (let i = 0; i < 3; i++) await pickFirst(page);
  await page.getByRole('button', { name: 'Play the quarter-final' }).click();
  await expect(page.getByRole('region', { name: 'Quarter-final' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('region', { name: 'Quarter-final' })).toContainText(/Won \d–\d|Lost \d–\d/);
});

test('Leader Mayhem: without a network on first opening, it says so and can retry', async ({ page }) => {
  await useSampleData(page);
  let down = true;
  await page.route(/\/data\/mayhem\.json$/, (route) => (down ? route.abort('internetdisconnected') : route.fallback()));
  await page.clock.install({ time: DAY_128 });
  await page.goto('/mayhem');
  await expect(page.getByText('Leader Mayhem could not be loaded.')).toBeVisible();
  down = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('button', { name: 'Form a government' })).toBeVisible();
});

for (const theme of ['dark', 'light'] as const) {
  test(`axe: mayhem (${theme}) has no violations while drafting and at the end`, async ({ page }) => {
    await useSampleData(page);
    await page.clock.install({ time: DAY_128 });
    await page.addInitScript((dark) => {
      if (localStorage.getItem('leaderdle')) return;
      localStorage.setItem('leaderdle', JSON.stringify({ v: 3, settings: { dark, cb: false, reduce: true }, consent: 'no', helpSeen: { classic: true }, stats: {}, streak: { n: 0, last: 0 }, days: {} }));
    }, theme === 'dark');
    await page.goto('/mayhem?seed=8');
    const check = async () => {
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    };
    await page.getByRole('button', { name: 'Form a government' }).click();
    await page.getByRole('group', { name: 'Leaders in office' }).getByRole('button').first().click();
    await check();
    await page.getByRole('button', { name: /^Give / }).first().click();
    for (let i = 0; i < 4; i++) await pickFirst(page);
    await playOut(page);
    await check();
  });
}

test('Leader Mayhem: a saved government naming a leader who left the list is set aside, not a blank page', async ({ page }) => {
  await useSampleData(page);
  await page.clock.install({ time: DAY_128 });
  await page.addInitScript(() => {
    if (localStorage.getItem('leaderdle')) return;
    const run = { seed: 1, draws: 3, cell: { country: 'Germany', decade: 2000 }, team: ['gone', 'tha', null, null, null], years: [1990, 1980, null, null, null], rerolls: { country: false, decade: false }, matches: [], done: false };
    localStorage.setItem('leaderdle', JSON.stringify({ v: 3, settings: { dark: false, cb: false, reduce: true }, consent: 'no', helpSeen: { classic: true }, stats: {}, streak: { n: 0, last: 0 }, days: {}, mayhem: { run, stats: { played: 0, titles: 0 } } }));
  });
  await page.goto('/mayhem');
  await expect(page.getByText('it cannot go on')).toBeVisible();
  await page.getByRole('button', { name: 'Form a new government' }).click();
  await expect(page.getByText('Pick 1 of 5')).toBeVisible();
});

test('Leader Mayhem: after a pick, the keyboard focus moves to the new draw', async ({ page }) => {
  await openAt(page, '/mayhem?seed=5');
  await page.getByRole('button', { name: 'Form a government' }).click();
  await page.getByRole('group', { name: 'Leaders in office' }).getByRole('button').first().click();
  await page.getByRole('button', { name: /^Give / }).first().click();
  await expect(page.getByText('Pick 2 of 5')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Leaders in office' }).getByRole('button').first()).toBeFocused();
});

test('Leader Mayhem: duel arena shows crisis, opposing ministers, actions, and supports Skip', async ({ page }) => {
  await openAt(page, '/mayhem?seed=5');
  await page.getByRole('button', { name: 'Form a government' }).click();
  await draft(page);
  await page.getByRole('button', { name: 'Play the quarter-final' }).click();
  const qf = page.getByRole('region', { name: 'Quarter-final' });
  await expect(qf.getByText('Crisis brief')).toBeVisible();
  await expect(qf.getByText('Your Minister')).toBeVisible();
  await expect(qf.getByText('Rival Minister')).toBeVisible();
  await qf.getByRole('button', { name: 'Skip' }).click();
  await expect(qf).toContainText(/Won \d–\d|Lost \d–\d/);
});

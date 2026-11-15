import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { closeHelp, DAY_128, guess, openAt, useSampleData } from './helpers';

test('first visit: home invites to play Classic, help opens on first game visit', async ({ page }) => {
  await openAt(page, '/');
  await expect(page.getByRole('heading', { name: "Today's puzzles" })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Cookie consent' })).toBeVisible();
  await page.getByRole('button', { name: 'Decline' }).click();
  await expect(page.getByRole('region', { name: 'Cookie consent' })).toBeHidden();
  await page.getByRole('link', { name: 'Play: Classic' }).click();
  await expect(page).toHaveURL(/\/classic$/);
  await expect(page.getByRole('heading', { name: 'How to play Classic' })).toBeVisible();
  await closeHelp(page);
  // Focus goes back where it was, and help does not reopen on the next visit.
  await page.reload();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('Classic: win, share, stats, reload keeps the result', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openAt(page, '/classic');
  await closeHelp(page);

  await guess(page, 'Thatcher');
  await expect(page.getByText('7 guesses left')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Age at start: 53, close, target is younger' })).toBeVisible();

  await guess(page, 'merkel');
  await expect(page.getByRole('heading', { name: 'You got it!' })).toBeVisible();
  await expect(page.getByText('Solved in 2 of 8 guesses')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Angela Merkel', level: 3 })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Streak: 1 day' })).toBeVisible();

  await page.getByRole('button', { name: 'Share result' }).click();
  await expect(page.getByText('Copied to clipboard')).toBeVisible();
  // The Windows clipboard turns line breaks into CRLF.
  const text = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n');
  expect(text).toBe('Leaderdle #128 · Classic 2/8\n🟧🟩⬆️⬆️🟧\n🟩🟩🟩🟩🟩\nleaderdle.com');

  await page.reload();
  await expect(page.getByRole('heading', { name: 'You got it!' })).toBeVisible();
  await expect(page.getByRole('combobox')).toHaveCount(0);

  await page.getByRole('button', { name: 'Statistics' }).click();
  const stats = page.getByRole('dialog');
  await expect(stats.getByRole('tab', { name: 'Classic', selected: true })).toBeVisible();
  await expect(stats.getByText('100%')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(stats).toBeHidden();
  await expect(page.getByRole('button', { name: 'Statistics' })).toBeFocused();

  await page.getByRole('link', { name: 'Next up: Letters' }).click();
  await expect(page).toHaveURL(/\/letters$/);
});

test('Classic: invalid entries explain themselves', async ({ page }) => {
  await openAt(page, '/classic');
  await closeHelp(page);
  await guess(page, 'zzzz');
  await expect(page.getByRole('status').filter({ hasText: 'No leader found. Check the spelling?' })).toBeVisible();
  await guess(page, 'Kohl');
  await guess(page, 'Kohl');
  await expect(page.getByRole('status').filter({ hasText: 'You already tried Helmut Kohl.' })).toBeVisible();
});

test('Classic: hint after five misses, loss reveals the answer', async ({ page }) => {
  await openAt(page, '/classic');
  await closeHelp(page);
  for (const n of ['Lee Kuan Yew', 'Thatcher', 'Mandela', 'Ardern', 'Churchill']) await guess(page, n);
  await page.getByRole('button', { name: 'Reveal initials' }).click();
  await expect(page.getByText('Initials:')).toContainText('A. M.');
  for (const n of ['Obama', 'Blair', 'Kohl']) await guess(page, n);
  await expect(page.getByRole('heading', { name: 'Not this time' })).toBeVisible();
  await expect(page.getByText('Out of guesses. The answer was Angela Merkel.')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Initials hint used' })).toBeVisible();
});

test('Succession: misses unlock clues, win flips the mystery box', async ({ page }) => {
  await openAt(page, '/succession');
  await closeHelp(page);
  await guess(page, 'Kohl', 'Who governed in between?');
  await expect(page.getByText('2005 – 2021').first()).toBeVisible();
  await expect(page.getByText('Unlocks after miss 2')).toBeVisible();
  await guess(page, 'Merkel', 'Who governed in between?');
  await expect(page.getByRole('heading', { name: 'You got it!' })).toBeVisible();
  await expect(page.getByText('1998 – 2005')).toBeVisible();
});

test('Timeline: keyboard buttons, locked cards, three checks', async ({ page }) => {
  await openAt(page, '/timeline');
  await closeHelp(page);
  const cards = page.getByRole('list', { name: 'Leaders to order' }).getByRole('listitem');
  // Start: Mandela, Ardern, Lee Kuan Yew, Merkel, Thatcher.
  await page.getByRole('button', { name: 'Move Lee Kuan Yew up' }).click();
  await page.getByRole('button', { name: 'Move Lee Kuan Yew up' }).click();
  await expect(cards.first()).toContainText('Lee Kuan Yew');
  await page.getByRole('button', { name: 'Check my order' }).click();
  await expect(page.getByText('of 5 in the right spot')).toBeVisible();
  await expect(cards.first()).toContainText('Right spot');
  await expect(page.getByRole('button', { name: 'Move Lee Kuan Yew up' })).toHaveCount(0);
  // Order is now LKY, Mandela, Ardern, Merkel, Thatcher. Thatcher up jumps over the locked Merkel.
  await page.getByRole('button', { name: 'Move Margaret Thatcher up' }).click();
  await expect(cards.nth(2)).toContainText('Margaret Thatcher');
  await page.getByRole('button', { name: 'Move Margaret Thatcher up' }).click();
  await page.getByRole('button', { name: 'Check my order' }).click();
  await expect(page.getByRole('heading', { name: 'All in order!' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'The right order' })).toContainText('1959');
});

test('the day summary appears when all four are done, and the rules open only once', async ({ page }) => {
  await openAt(page, '/classic');
  await closeHelp(page);
  await guess(page, 'Merkel');
  await page.getByRole('link', { name: 'Next up: Letters' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.keyboard.type('obama');
  await page.keyboard.press('Enter');
  await page.getByRole('link', { name: 'Next up: Succession' }).click();
  await guess(page, 'Merkel', 'Who governed in between?');
  await page.getByRole('link', { name: 'Next up: Timeline' }).click();
  // Start: Mandela, Ardern, Lee Kuan Yew, Merkel, Thatcher. Each check needs a new order.
  const check = page.getByRole('button', { name: 'Check my order' });
  await check.click();
  await expect(check).toBeDisabled();
  await page.getByRole('button', { name: 'Move Jacinda Ardern up' }).click();
  await check.click();
  await page.getByRole('button', { name: 'Move Jacinda Ardern down' }).click();
  await check.click();
  await page.getByRole('link', { name: "See today's summary" }).click();
  await expect(page.getByRole('heading', { name: 'Day complete' })).toBeVisible();
  await expect(page.getByText('Classic 1/8 · Letters 1/6 · Succession 1/5 · Timeline X/3')).toBeVisible();
});

test('a game started before midnight stays on its day until reload', async ({ page }) => {
  await openAt(page, '/classic', new Date(2026, 10, 15, 23, 59, 50));
  await closeHelp(page);
  await guess(page, 'Kohl');
  await page.clock.runFor(20_000);
  await expect(page.getByRole('heading', { name: /Classic #128/ })).toBeVisible();
  await guess(page, 'Merkel');
  await expect(page.getByRole('heading', { name: 'You got it!' })).toBeVisible();
  // Next load is day 129: no file in the sample data, so the data error screen shows.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Today’s puzzles aren’t ready' })).toBeVisible();
});

test('offline on first load shows the offline screen', async ({ page }) => {
  await page.route(/\/data\/.*\.json$/, (route) => route.abort('internetdisconnected'));
  await page.clock.install({ time: DAY_128 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'You’re offline' })).toBeVisible();
});

test('works without storage (private browsing)', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('denied', 'SecurityError');
      },
    });
  });
  await openAt(page, '/classic');
  await closeHelp(page);
  await guess(page, 'Merkel');
  await expect(page.getByRole('heading', { name: 'You got it!' })).toBeVisible();
});

test('settings: dark theme, colorblind colors, clear data', async ({ page }) => {
  await openAt(page, '/classic');
  await closeHelp(page);
  await guess(page, 'Merkel');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('switch', { name: 'Dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/th-dark/);
  await page.getByRole('switch', { name: 'Colorblind colors' }).click();
  await expect(page.locator('html')).toHaveClass(/cb/);
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(page.getByText('Your data was cleared')).toBeVisible();
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('combobox')).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/th-dark/);
});

test('unknown pages show the 404 screen', async ({ page }) => {
  await openAt(page, '/nope');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to puzzles' }).click();
  await expect(page.getByRole('heading', { name: "Today's puzzles" })).toBeVisible();
});

for (const [name, path] of [['home', '/'], ['classic', '/classic'], ['letters', '/letters'], ['succession', '/succession'], ['timeline', '/timeline'], ['privacy', '/privacy']] as const) {
  for (const theme of ['dark', 'light'] as const) {
    test(`axe: ${name} (${theme}) has no violations`, async ({ page }) => {
      await useSampleData(page);
      await page.clock.install({ time: DAY_128 });
      await page.addInitScript((dark) => {
        localStorage.setItem('leaderdle', JSON.stringify({ v: 3, settings: { dark, cb: false, reduce: true }, consent: 'no', helpSeen: { classic: true }, stats: {}, streak: { n: 0, last: 0 }, days: {} }));
      }, theme === 'dark');
      await page.goto(path);
      await expect(page.locator('html')).toHaveClass(theme === 'dark' ? /th-dark/ : /th-light/);
      if (path === '/classic') await guess(page, 'Thatcher');
      if (path === '/succession') await guess(page, 'Kohl', 'Who governed in between?');
      if (path === '/letters') {
        await page.keyboard.type('about');
        await page.keyboard.press('Enter');
        await page.keyboard.type('ob');
      }
      await expect(page.locator('main')).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }
}

test('Timeline: the same order cannot be checked twice', async ({ page }) => {
  await openAt(page, '/timeline');
  await closeHelp(page);
  const check = page.getByRole('button', { name: 'Check my order' });
  await check.dblclick();
  await expect(page.getByText('2 checks left')).toBeVisible();
  await expect(check).toBeDisabled();
  await expect(page.getByText('Move a card to check again.')).toBeVisible();
});

test('after midnight, an open tab offers the new puzzles without touching the current game', async ({ page }) => {
  await openAt(page, '/classic', new Date(2026, 10, 15, 23, 59, 30));
  await closeHelp(page);
  await guess(page, 'Kohl');
  await page.clock.runFor(61_000);
  const banner = page.getByRole('status').filter({ hasText: 'New puzzles are ready.' });
  await expect(banner).toBeVisible();
  await expect(page.getByText('7 guesses left')).toBeVisible();
  await banner.getByRole('button', { name: 'Load them' }).click();
  // Day 129 has no file in the sample data.
  await expect(page.getByRole('heading', { name: 'Today’s puzzles aren’t ready' })).toBeVisible();
});

test('two tabs: a stale tab does not erase progress saved by the other', async ({ context }) => {
  const a = await context.newPage();
  const b = await context.newPage();
  await openAt(a, '/classic');
  await closeHelp(a);
  await openAt(b, '/classic');
  await guess(b, 'Merkel');
  await expect(b.getByRole('heading', { name: 'You got it!' })).toBeVisible();
  // Tab A catches up, then saves a setting.
  await expect(a.getByRole('heading', { name: 'You got it!' })).toBeVisible();
  await a.getByRole('button', { name: 'Settings' }).click();
  await a.getByRole('switch', { name: 'Reduce motion' }).click();
  await b.reload();
  await expect(b.getByRole('heading', { name: 'You got it!' })).toBeVisible();
  await expect(b.getByRole('img', { name: 'Streak: 1 day' })).toBeVisible();
});

test('the win celebration plays once, not again when coming back to the mode', async ({ page }) => {
  await openAt(page, '/classic');
  await closeHelp(page);
  await guess(page, 'Merkel');
  await expect(page.locator('[class*="stampIn"]')).toBeAttached();
  await page.getByRole('link', { name: 'Succession', exact: true }).click();
  await page.getByRole('link', { name: /^Classic/ }).click();
  await expect(page.getByRole('heading', { name: 'You got it!' })).toBeVisible();
  await expect(page.locator('[class*="stampIn"]')).toHaveCount(0);
  await expect(page.locator('[class*="flip"]')).toHaveCount(0);
});

test('Letters: type any letters, colors follow Wordle rules, win and share', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openAt(page, '/letters');
  await closeHelp(page);
  await expect(page.getByText('5 letters')).toBeVisible();

  // An unfinished row is refused and costs nothing.
  await page.keyboard.type('ab');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Fill all 5 letters first.')).toBeVisible();
  await expect(page.getByText('6 guesses left')).toBeVisible();
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');

  // ABOUT against OBAMA: A and O are elsewhere, B is in place, U and T are not in the name.
  await page.keyboard.type('about');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('group', { name: 'Guess 1: A wrong place, B right place, O wrong place, U not in the name, T not in the name' })).toBeVisible();
  await expect(page.getByText('5 guesses left')).toBeVisible();
  await expect(page.getByRole('button', { name: 'B, right place' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'U, not in the name' })).toBeVisible();

  // The on-screen keyboard does the same as the real one.
  for (const k of ['O', 'B', 'A', 'M', 'A']) await page.getByRole('button', { name: new RegExp('^' + k + '($|,)') }).click();
  await page.getByRole('button', { name: 'Enter' }).click();
  await expect(page.getByRole('heading', { name: 'You got it!' })).toBeVisible();
  await expect(page.getByText('Spelled in 2 of 6 guesses')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Barack Obama', level: 3 })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Keyboard' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Share result' }).click();
  const text = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n');
  expect(text).toBe('Leaderdle #128 · Letters 2/6\n🟧🟩🟧⬛⬛\n🟩🟩🟩🟩🟩\nleaderdle.com');

  await page.reload();
  await expect(page.getByRole('heading', { name: 'You got it!' })).toBeVisible();
});

test('Letters: clues unlock after two and four misses, a loss shows the name', async ({ page }) => {
  await openAt(page, '/letters');
  await closeHelp(page);
  const miss = async () => {
    await page.keyboard.type('stern');
    await page.keyboard.press('Enter');
  };
  await miss();
  await expect(page.getByText('Unlocks after miss 2')).toBeVisible();
  await miss();
  await expect(page.getByText('North America')).toBeVisible();
  await expect(page.getByText('Unlocks after miss 4')).toBeVisible();
  await miss();
  await miss();
  await expect(page.getByText('United States')).toBeVisible();
  await miss();
  await miss();
  await expect(page.getByRole('heading', { name: 'Not this time' })).toBeVisible();
  await expect(page.getByText('Out of guesses. The name was OBAMA.')).toBeVisible();
});

import { expect, test, type Page } from '@playwright/test';
import { closeHelp, guess, openAt } from './helpers';

const cards = (page: Page) => page.getByRole('list', { name: 'Leaders to order' }).getByRole('listitem');

/** Real touch events through the Chrome DevTools Protocol, finger moving in small steps. */
async function touchDrag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  const cdp = await page.context().newCDPSession(page);
  const point = (x: number, y: number) => [{ x, y, id: 1, radiusX: 8, radiusY: 8, force: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(from.x, from.y) });
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    const x = from.x + ((to.x - from.x) * i) / steps;
    const y = from.y + ((to.y - from.y) * i) / steps;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(x, y) });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

test('phone tiles use short codes and the suggestion list pushes content down', async ({ page }) => {
  await openAt(page, '/classic');
  await closeHelp(page);
  await guess(page, 'Thatcher');
  expect(await page.getByRole('img', { name: /^Country: United Kingdom/ }).innerText()).toBe('GBR');
  expect(await page.getByRole('img', { name: /^Role: Head of government/ }).innerText()).toBe('Gov');
  await page.getByRole('combobox').click();
  await expect(page.getByRole('listbox')).toHaveCSS('position', 'static');
});

test('Timeline: a finger drags a card to the top', async ({ page }) => {
  await openAt(page, '/timeline');
  await closeHelp(page);
  // Start: Mandela, Ardern, Lee Kuan Yew, Merkel, Thatcher.
  const handle = page.getByRole('button', { name: 'Drag Lee Kuan Yew, position 3' });
  const box = (await handle.boundingBox())!;
  const top = (await cards(page).first().boundingBox())!;
  await touchDrag(page, { x: box.x + box.width / 2, y: box.y + box.height / 2 }, { x: box.x + box.width / 2, y: top.y + 8 });
  await expect(cards(page).first()).toContainText('Lee Kuan Yew');
  await expect(cards(page).nth(1)).toContainText('Nelson Mandela');
});

test('Timeline: dragging never moves a locked card', async ({ page }) => {
  await openAt(page, '/timeline');
  await closeHelp(page);
  await page.getByRole('button', { name: 'Check my order' }).click();
  // Merkel (position 4) is in the right spot and locked. Drag Thatcher (5) to the top.
  await expect(cards(page).nth(3)).toContainText('Right spot');
  const handle = page.getByRole('button', { name: 'Drag Margaret Thatcher, position 5' });
  const box = (await handle.boundingBox())!;
  const top = (await cards(page).first().boundingBox())!;
  await touchDrag(page, { x: box.x + box.width / 2, y: box.y + box.height / 2 }, { x: box.x + box.width / 2, y: top.y + 8 });
  await expect(cards(page).first()).toContainText('Margaret Thatcher');
  await expect(cards(page).nth(3)).toContainText('Angela Merkel');
});

test('Timeline: keyboard drag with space and arrows', async ({ page }) => {
  await openAt(page, '/timeline');
  await closeHelp(page);
  await page.getByRole('button', { name: 'Drag Lee Kuan Yew, position 3' }).focus();
  for (const key of ['Space', 'ArrowUp', 'ArrowUp', 'Space']) {
    await page.keyboard.press(key);
    await page.waitForTimeout(150);
  }
  await expect(cards(page).first()).toContainText('Lee Kuan Yew');
});

test('the cookie banner sits in the page and never covers the game or its keyboard', async ({ page }) => {
  await openAt(page, '/');
  const banner = page.getByRole('region', { name: 'Cookie consent' });
  await expect(banner).toBeVisible();
  await page.getByRole('link', { name: 'Play: Classic' }).click();
  await page.getByRole('button', { name: 'Got it' }).click();
  const below = async (name: string, locator: ReturnType<typeof page.locator>) => {
    const bar = (await banner.boundingBox())!;
    const box = (await locator.boundingBox())!;
    expect(box.y, name).toBeGreaterThanOrEqual(bar.y + bar.height);
  };
  await below('name field', page.getByRole('combobox'));
  await page.getByRole('link', { name: 'Letters' }).click();
  await below('board', page.getByRole('group', { name: /^Guess 1/ }));
  await below('keyboard', page.getByRole('group', { name: 'Keyboard' }));
  expect(await banner.evaluate((el) => getComputedStyle(el).position)).toBe('static');
});

test('Letters on a phone: the whole board and keyboard fit the screen width, keys are tappable', async ({ page }) => {
  await openAt(page, '/letters');
  await closeHelp(page);
  for (const k of ['A', 'B', 'O', 'U', 'T']) await page.getByRole('button', { name: k, exact: true }).tap();
  await page.getByRole('button', { name: 'Enter' }).tap();
  await expect(page.getByText('5 guesses left')).toBeVisible();
  const width = page.viewportSize()!.width;
  for (const key of await page.getByRole('group', { name: 'Keyboard' }).getByRole('button').all()) {
    const box = (await key.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});

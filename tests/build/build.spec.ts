import { expect, test } from '@playwright/test';
import { DAY_128, useSampleData } from '../e2e/helpers';

test.beforeEach(async ({ page, context }) => {
  await useSampleData(context);
  await page.clock.install({ time: DAY_128 });
});

test('every route is a real file: direct loads work without a rewrite rule', async ({ page }) => {
  for (const [path, heading] of [
    ['/about', 'About Leaderdle'],
    ['/how-we-pick', 'How we pick and describe leaders'],
    ['/privacy', 'Privacy'],
    ['/report', 'Report an error'],
  ] as const) {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
    await expect(page).toHaveTitle(/Leaderdle/);
  }
});

test('unknown URLs get the 404 page with a 404 status', async ({ page }) => {
  const res = await page.goto('/no-such-page');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('a started game reloads offline thanks to the service worker', async ({ page, context }) => {
  await page.goto('/classic');
  await page.getByRole('button', { name: 'Got it' }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Second load goes through the service worker, which caches the data files.
  await page.reload();
  await page.getByRole('combobox').fill('Kohl');
  await page.getByRole('combobox').press('Enter');
  await expect(page.getByText('7 guesses left')).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('7 guesses left')).toBeVisible();
  await page.getByRole('combobox').fill('Merkel');
  await page.getByRole('combobox').press('Enter');
  await expect(page.getByRole('heading', { name: 'You got it!' })).toBeVisible();
});

test('a malformed URL gets a 400 and the server keeps running', async ({ request }) => {
  const bad = await request.get('/%E0%A4%A');
  expect(bad.status()).toBe(400);
  expect((await request.get('/about')).status()).toBe(200);
});

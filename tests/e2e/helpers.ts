import { expect, type BrowserContext, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const SAMPLE_LEADERS = readFileSync('src/dev/sample-leaders.json', 'utf8');
const SAMPLE_DAY = readFileSync('src/dev/sample-day-128.json', 'utf8');

/** Serves the prototype sample data (puzzle #128: Angela Merkel) instead of the real schedule. */
export async function useSampleData(target: Page | BrowserContext) {
  await target.route(/\/data\/leaders\.json$/, (route) => route.fulfill({ contentType: 'application/json', body: SAMPLE_LEADERS }));
  await target.route(/\/data\/days\/\d+\.json$/, (route) =>
    route.request().url().endsWith('/128.json')
      ? route.fulfill({ contentType: 'application/json', body: SAMPLE_DAY })
      : route.fulfill({ status: 404, body: 'not found' }),
  );
}

/** 15 Nov 2026, noon local time: puzzle #128 with the sample data. */
export const DAY_128 = new Date(2026, 10, 15, 12, 0, 0);

export async function openAt(page: Page, path: string, time = DAY_128) {
  await useSampleData(page);
  await page.clock.install({ time });
  await page.goto(path);
}

export async function closeHelp(page: Page) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Got it' }).click();
  await expect(dialog).toBeHidden();
}

export async function guess(page: Page, name: string, label = 'Who is today’s leader?') {
  const input = page.getByRole('combobox', { name: label });
  await input.fill(name);
  await input.press('Enter');
}

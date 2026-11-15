import { expect, type Page } from '@playwright/test';

/** 15 Nov 2026, noon local time: puzzle #128 with the sample data. */
export const DAY_128 = new Date(2026, 10, 15, 12, 0, 0);

export async function openAt(page: Page, path: string, time = DAY_128) {
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

import { expect, test } from '@playwright/test';
import { BASE, addWine, openWine, signUpViaApi } from './helpers';

test('„Cumpără din nou” după ultima sticlă dintr-un vin favorit', async ({ page }) => {
  await signUpViaApi(page);
  const name = `Reorder E2E ${Date.now()}`;
  await addWine(page, { name, quantity: 1 });
  await openWine(page, name);

  await page.getByRole('button', { name: /Favorit/ }).click();
  await expect(page.getByRole('button', { name: /❤️/ })).toBeVisible();
  await page.getByRole('button', { name: /Consumă o sticlă/ }).click();
  await page.getByRole('button', { name: /Confirmi\?/ }).click();
  await expect(page.getByRole('button', { name: /Consumă o sticlă/ })).toHaveCount(0);

  await page.reload();
  await expect(page.getByText('Ți-a plăcut și s-a terminat')).toBeVisible();
  await expect(page.getByRole('link', { name: /Vivino/ })).toHaveAttribute('href', /vivino\.com/);
  await page.getByLabel('Sticle cumpărate').fill('3');
  await page.getByRole('button', { name: 'L-am cumpărat din nou' }).click();
  await expect(page.locator('.wd-qs-item', { hasText: 'Sticle' }).locator('.wd-qs-value')).toHaveText('3');
  await expect(page.getByText('Ți-a plăcut și s-a terminat')).toHaveCount(0);
});

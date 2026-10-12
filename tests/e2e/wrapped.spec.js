import { expect, test } from '@playwright/test';
import { BASE, addWine, signUpViaApi } from './helpers';

test('Wrapped: an gol, apoi consumul apare în recapitulare', async ({ page }) => {
  await signUpViaApi(page);
  await page.goto(`${BASE}/wrapped`);
  await expect(page.getByText(/Încă nu ai consumat nicio sticlă/)).toBeVisible();

  const name = `Wrapped E2E ${Date.now()}`;
  await addWine(page, { name, quantity: 2 });
  await page.getByText(name).first().click();
  await page.getByRole('button', { name: /Consumă o sticlă/ }).click();
  await page.getByRole('button', { name: /Confirmi\?/ }).click();
  await expect(page.locator('.wd-qs-item', { hasText: 'Sticle' }).locator('.wd-qs-value')).toHaveText('1');

  await page.goto(`${BASE}/wrapped`);
  await expect(page.getByText('sticlă deschisă')).toBeVisible();
  await expect(page.getByText('Pivnița azi')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Distribuie anul tău' })).toBeVisible();
});

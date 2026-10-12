import { expect, test } from '@playwright/test';
import { BASE, signUpViaApi } from './helpers';

test('adăugare rapidă: fraza dictată/scrisă devine un vin, cu previzualizare editabilă', async ({ page }) => {
  await signUpViaApi(page);
  await page.goto(`${BASE}/wines/add`);
  await page.getByLabel('Ce ai cumpărat?').fill('Am luat 6 Fetească Neagră 2021 de la Davino cu 80 lei');
  await page.getByRole('button', { name: 'Interpretează' }).click();

  const preview = page.getByRole('region', { name: 'Adăugare rapidă' });
  await expect(preview.getByLabel('Nume', { exact: true })).toHaveValue('Fetească Neagră');
  await expect(preview.getByLabel('Producător', { exact: true })).toHaveValue('Davino');
  await expect(preview.getByLabel('An', { exact: true })).toHaveValue('2021');
  await expect(preview.getByLabel('Sticle', { exact: true })).toHaveValue('6');
  await expect(preview.getByLabel('Monedă')).toHaveValue('RON');
  await expect(preview.getByText('Interpretat fără AI')).toBeVisible();

  await preview.getByLabel('Sticle', { exact: true }).fill('5');
  await preview.getByRole('button', { name: 'Adaugă în pivniță' }).click();
  await expect(preview.getByRole('status')).toContainText('Fetească Neagră');

  await preview.getByRole('link', { name: 'Fetească Neagră' }).click();
  await expect(page.getByRole('heading', { name: /Fetească Neagră/ }).first()).toBeVisible();
  await expect(page.getByText('Davino').first()).toBeVisible();
});

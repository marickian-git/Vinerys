import { expect, test } from '@playwright/test';
import { BASE, signUpViaApi } from './helpers';

test('import Vivino: preview, duplicate sărite, vinurile apar în colecție', async ({ page }) => {
  await signUpViaApi(page);
  await page.goto(`${BASE}/wines/import`);
  await page.getByLabel('Fișier CSV').setInputFiles('tests/fixtures/vivino.csv');
  await expect(page.getByLabel('Format:')).toHaveValue('vivino');
  await expect(page.getByText('3 noi · 1 duplicate · 1 cu erori')).toBeVisible();

  await page.getByRole('button', { name: 'Importă 3 vinuri' }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE}/wines$`));
  await expect(page.getByText('Flamboyant').first()).toBeVisible();
  await expect(page.getByText('Malbec Argentino').first()).toBeVisible();

  // Al doilea import al aceluiași fișier nu mai aduce nimic nou
  await page.goto(`${BASE}/wines/import`);
  await page.getByLabel('Fișier CSV').setInputFiles('tests/fixtures/vivino.csv');
  await expect(page.getByText('0 noi · 4 duplicate · 1 cu erori')).toBeVisible();
});

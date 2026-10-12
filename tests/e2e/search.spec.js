import { expect, test } from '@playwright/test';
import { BASE, signUpViaApi } from './helpers';

test('căutare fuzzy, limbaj natural și filtre salvate', async ({ page }) => {
  await signUpViaApi(page);
  await page.goto(`${BASE}/wines/import`);
  await page.getByLabel('Fișier CSV').setInputFiles('tests/fixtures/vivino.csv');
  await page.getByRole('button', { name: 'Importă 3 vinuri' }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE}/wines$`));

  // Greșeală de tastare → tot găsește
  await page.goto(`${BASE}/wines?search=${encodeURIComponent('flambyant')}`);
  await expect(page.getByText('Flamboyant').first()).toBeVisible();
  await expect(page.getByText('Malbec Argentino')).toHaveCount(0);

  // Limbaj natural: tip + preț
  await page.goto(`${BASE}/wines?search=${encodeURIComponent('albe sub 100 lei')}`);
  await expect(page.getByText('Sole Chardonnay').first()).toBeVisible();
  await expect(page.getByText('Flamboyant')).toHaveCount(0);

  // Soiuri/regiune: „mendoza” e în regiune
  await page.goto(`${BASE}/wines?search=mendoza`);
  await expect(page.getByText('Malbec Argentino').first()).toBeVisible();

  // Salvare filtru și refolosire
  await page.goto(`${BASE}/wines?search=${encodeURIComponent('albe sub 100 lei')}`);
  await page.getByRole('button', { name: '+ Salvează filtrul' }).click();
  await page.getByLabel('Numele filtrului').fill('Albe ieftine');
  await page.getByRole('button', { name: 'Salvează', exact: true }).click();
  await page.goto(`${BASE}/wines`);
  await page.getByRole('link', { name: 'Albe ieftine' }).click();
  await expect(page).toHaveURL(/search=/);
  await expect(page.getByText('Sole Chardonnay').first()).toBeVisible();
});

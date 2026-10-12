import { expect, test } from '@playwright/test';
import { BASE, signUpViaApi } from './helpers';

test('valoarea pivniței: ROI, câștiguri, istoric pe vin și raportul pentru asigurare', async ({ page }) => {
  await signUpViaApi(page);
  await page.goto(`${BASE}/wines/import`);
  await page.getByLabel('Fișier CSV').setInputFiles('tests/fixtures/cellartracker.csv');
  await page.getByRole('button', { name: 'Importă 3 vinuri' }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE}/wines$`));

  await page.goto(`${BASE}/value`);
  // Musar 2 × (45 → 80), Champagne 3 × (60 → 65); Tokaji fără valoare
  await expect(page.getByText('+31%')).toBeVisible(); // (2×80 + 3×65) / (2×45 + 3×60) = 355 / 270
  await expect(page.getByRole('heading', { name: 'Cele mai mari câștiguri' })).toBeVisible();
  await expect(page.getByText(/1 vin nu are preț/)).toBeVisible();

  await page.getByRole('link', { name: /Château Musar Rouge/ }).click();
  await expect(page.getByText('Valoare în timp')).toBeVisible();
  await expect(page.getByText('+78%')).toBeVisible();

  await page.goto(`${BASE}/value/report`);
  await expect(page.getByRole('heading', { name: /Raport de valoare/ })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Tokaji Aszú 5 Puttonyos' })).toBeVisible();
});

import { expect, test } from '@playwright/test';
import { BASE, signUpViaApi } from './helpers';

test('planul de consum împarte sticlele pe ani și listează vinurile fără fereastră', async ({ page }) => {
  await signUpViaApi(page);
  await page.goto(`${BASE}/wines/import`);
  await page.getByLabel('Fișier CSV').setInputFiles('tests/fixtures/cellartracker.csv');
  await page.getByRole('button', { name: 'Importă 3 vinuri' }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE}/wines$`));

  await page.goto(`${BASE}/planner`);
  await expect(page.getByRole('heading', { name: 'Plan de consum' })).toBeVisible();
  // HOME-006: planul de weekend, cu vinul trecut de vârf vineri
  await expect(page.getByRole('heading', { name: 'Weekendul ăsta' })).toBeVisible();
  await expect(page.getByText(/^Vineri ·/)).toBeVisible();
  await expect(page.getByRole('link', { name: /Château Musar Rouge/ }).first()).toBeVisible();
  // Champagne NV nu are fereastră în CSV
  await expect(page.getByRole('heading', { name: 'Fără fereastră de consum' })).toBeVisible();
  const noWindow = page.locator('section', { has: page.getByRole('heading', { name: 'Fără fereastră de consum' }) });
  await expect(noWindow.getByRole('link', { name: 'Brut Rosé NV' })).toBeVisible();
});

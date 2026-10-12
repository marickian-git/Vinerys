import { expect, test } from '@playwright/test';
import { BASE, signUpViaApi } from './helpers';

test('profilul de gust se învață din ratinguri și recomandă din pivniță', async ({ page }) => {
  await signUpViaApi(page);
  await page.goto(`${BASE}/profile`);
  await expect(page.getByText('Dă note vinurilor')).toBeVisible();

  await page.goto(`${BASE}/wines/import`);
  await page.getByLabel('Fișier CSV').setInputFiles('tests/fixtures/cellartracker.csv');
  await page.getByRole('button', { name: 'Importă 3 vinuri' }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE}/wines$`));

  await page.goto(`${BASE}/profile`);
  await expect(page.getByText('Bazat pe 2 vinuri')).toBeVisible();
  await expect(page.getByText('Pinot Noir', { exact: true })).toBeVisible();
  await expect(page.getByText('Din pivniță, pe gustul tău')).toBeVisible();
});

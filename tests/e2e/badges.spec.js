import { expect, test } from '@playwright/test';
import { BASE, signUpViaApi } from './helpers';

test('profilul arată badge-urile, cu progres din colecție', async ({ page }) => {
  await signUpViaApi(page);
  await page.goto(`${BASE}/wines/import`);
  await page.getByLabel('Fișier CSV').setInputFiles('tests/fixtures/vivino.csv');
  await page.getByRole('button', { name: 'Importă 3 vinuri' }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE}/wines$`));

  await page.goto(`${BASE}/profile`);
  await expect(page.getByText('Badge-uri')).toBeVisible();
  // 2 țări (România, Argentina) din 3 pentru Bronz
  await expect(page.getByRole('progressbar', { name: 'Globetrotter: 2 din 3' })).toBeVisible();
  await expect(page.getByText(/Următoarea provocare/)).toBeVisible();
});
